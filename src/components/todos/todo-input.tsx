'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, Flag, X, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { extractDateFromText, formatSmartDate } from '@/lib/utils/date-parser';
import { TodoPriority, Project } from '@/types';

interface TodoInputProps {
  onSubmit: (data: {
    title: string;
    due_date?: string | null;
    priority: TodoPriority;
    project_ids: string[];
  }) => void;
  projects?: Project[];
  defaultProjectId?: string;
  placeholder?: string;
}

const priorityConfig: Record<TodoPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-500' },
  medium: { label: 'Medium', color: 'text-blue-500' },
  high: { label: 'High', color: 'text-orange-500' },
  urgent: { label: 'Urgent', color: 'text-red-500' },
};

export function TodoInput({
  onSubmit,
  projects = [],
  defaultProjectId,
  placeholder = 'Add a todo... (try "finish report next tuesday")',
}: TodoInputProps) {
  const [input, setInput] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    defaultProjectId ? [defaultProjectId] : []
  );
  const [parsedDate, setParsedDate] = useState<{ text: string; date: Date } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse natural language dates as user types
  useEffect(() => {
    if (input.length > 3) {
      const { date, cleanText } = extractDateFromText(input);
      if (date && cleanText !== input) {
        setParsedDate({ text: cleanText, date });
      } else {
        setParsedDate(null);
      }
    } else {
      setParsedDate(null);
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim()) return;

    let title = input;
    let finalDueDate = dueDate;

    // If we parsed a date from the text, use it
    if (parsedDate) {
      title = parsedDate.text;
      finalDueDate = parsedDate.date;
    }

    onSubmit({
      title: title.trim(),
      due_date: finalDueDate?.toISOString() || null,
      priority,
      project_ids: selectedProjectIds,
    });

    // Reset form
    setInput('');
    setDueDate(undefined);
    setPriority('medium');
    setParsedDate(null);
    if (!defaultProjectId) {
      setSelectedProjectIds([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const acceptParsedDate = () => {
    if (parsedDate) {
      setInput(parsedDate.text);
      setDueDate(parsedDate.date);
      setParsedDate(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pr-10"
          />
          {input && (
            <button
              onClick={() => setInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={!input.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Parsed date suggestion */}
      {parsedDate && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Detected date:</span>
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
            onClick={acceptParsedDate}
          >
            <Calendar className="mr-1 h-3 w-3" />
            {formatSmartDate(parsedDate.date)}
          </Badge>
          <span className="text-xs text-muted-foreground">(click to confirm)</span>
        </div>
      )}

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Calendar className="mr-2 h-3.5 w-3.5" />
              {dueDate ? formatSmartDate(dueDate) : 'Due date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dueDate}
              onSelect={setDueDate}
              initialFocus
            />
            {dueDate && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setDueDate(undefined)}
                >
                  Clear date
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Priority selector */}
        <Select value={priority} onValueChange={(v) => setPriority(v as TodoPriority)}>
          <SelectTrigger className="h-8 w-[110px]">
            <Flag className={cn('mr-2 h-3.5 w-3.5', priorityConfig[priority].color)} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(priorityConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <span className={config.color}>{config.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Project selector */}
        {projects.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Folder className="mr-2 h-3.5 w-3.5" />
                {selectedProjectIds.length === 0
                  ? 'Link to project'
                  : `${selectedProjectIds.length} project(s)`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-2">
                  Link to projects (select multiple)
                </p>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => toggleProject(project.id)}
                  >
                    <Checkbox checked={selectedProjectIds.includes(project.id)} />
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm truncate">{project.name}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Selected projects badges */}
        {selectedProjectIds.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedProjectIds.map((id) => {
              const project = projects.find((p) => p.id === id);
              if (!project) return null;
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="text-xs cursor-pointer"
                  style={{
                    backgroundColor: `${project.color}20`,
                    borderColor: `${project.color}40`,
                  }}
                  onClick={() => toggleProject(id)}
                >
                  {project.name}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
