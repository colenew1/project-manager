import * as chrono from 'chrono-node';
import { format, isToday, isTomorrow, isThisWeek, isYesterday, isPast, differenceInDays } from 'date-fns';

export interface ParsedDateResult {
  date: Date | null;
  text: string;
  confidence: number;
}

/**
 * Parse natural language date strings into Date objects
 * Examples: "next tuesday", "tomorrow at 3pm", "in 2 weeks", "dec 25"
 */
export function parseNaturalDate(input: string): ParsedDateResult {
  const parsed = chrono.parse(input);

  if (parsed.length === 0) {
    return { date: null, text: input, confidence: 0 };
  }

  const result = parsed[0];
  return {
    date: result.start.date(),
    text: result.text,
    confidence: result.start.isCertain('day') ? 1 : 0.5,
  };
}

/**
 * Extract date from input and return the remaining text
 * Example: "finish report next tuesday" -> { date: Date, cleanText: "finish report" }
 */
export function extractDateFromText(input: string): { date: Date | null; cleanText: string } {
  const parsed = chrono.parse(input);

  if (parsed.length === 0) {
    return { date: null, cleanText: input.trim() };
  }

  const result = parsed[0];
  const cleanText = input
    .slice(0, result.index) + input.slice(result.index + result.text.length)
    .replace(/\s+/g, ' ')
    .trim();

  return {
    date: result.start.date(),
    cleanText,
  };
}

/**
 * Format a date in a human-friendly way
 * Shows relative terms for nearby dates, full date for distant ones
 */
export function formatSmartDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';

  const daysAway = differenceInDays(d, new Date());

  if (daysAway > 0 && daysAway <= 7) {
    return format(d, 'EEEE'); // Day name like "Monday"
  }

  if (daysAway > 7 && daysAway <= 14) {
    return `Next ${format(d, 'EEEE')}`;
  }

  // For dates this year, skip the year
  if (d.getFullYear() === new Date().getFullYear()) {
    return format(d, 'MMM d'); // "Dec 15"
  }

  return format(d, 'MMM d, yyyy'); // "Dec 15, 2025"
}

/**
 * Format date with time if present
 */
export function formatSmartDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatSmartDate(d);

  // Check if time is not midnight (indicating a specific time was set)
  if (d.getHours() !== 0 || d.getMinutes() !== 0) {
    return `${dateStr} at ${format(d, 'h:mm a')}`;
  }

  return dateStr;
}

/**
 * Check if a due date is overdue
 */
export function isOverdue(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isPast(d) && !isToday(d);
}

/**
 * Get urgency level based on due date
 */
export function getDateUrgency(date: Date | string): 'overdue' | 'today' | 'soon' | 'later' | 'none' {
  if (!date) return 'none';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isOverdue(d)) return 'overdue';
  if (isToday(d)) return 'today';

  const daysAway = differenceInDays(d, new Date());
  if (daysAway <= 3) return 'soon';

  return 'later';
}
