'use client';

import { useState } from 'react';
import { Calendar, Flag, MoreHorizontal, Pencil, Trash2, Folder } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Todo, TodoPriority } from '@/types';
import { formatSmartDate, getDateUrgency } from '@/lib/utils/date-parser';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, is_completed: boolean) => void;
  onEdit?: (todo: Todo) => void;
  onDelete?: (id: string) => void;
  showProjects?: boolean;
}

const priorityConfig: Record<TodoPriority, { color: string; bgColor: string }> = {
  low: { color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  medium: { color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  high: { color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  urgent: { color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

const urgencyColors = {
  overdue: 'text-red-500 bg-red-500/10',
  today: 'text-orange-500 bg-orange-500/10',
  soon: 'text-yellow-500 bg-yellow-500/10',
  later: 'text-muted-foreground bg-muted',
  none: '',
};

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  showProjects = true,
}: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const urgency = todo.due_date ? getDateUrgency(todo.due_date) : 'none';

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-all',
        'hover:border-border hover:bg-muted/50',
        todo.is_completed && 'opacity-60'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <Checkbox
        checked={todo.is_completed}
        onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
        className="mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm',
            todo.is_completed && 'line-through text-muted-foreground'
          )}
        >
          {todo.title}
        </p>

        {/* Meta info */}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Due date */}
          {todo.due_date && (
            <Badge
              variant="secondary"
              className={cn('text-xs', urgencyColors[urgency])}
            >
              <Calendar className="mr-1 h-3 w-3" />
              {formatSmartDate(todo.due_date)}
            </Badge>
          )}

          {/* Priority */}
          {todo.priority !== 'medium' && (
            <Badge
              variant="secondary"
              className={cn('text-xs', priorityConfig[todo.priority].bgColor)}
            >
              <Flag className={cn('mr-1 h-3 w-3', priorityConfig[todo.priority].color)} />
              {todo.priority}
            </Badge>
          )}

          {/* Linked projects */}
          {showProjects && todo.projects && todo.projects.length > 0 && (
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3 text-muted-foreground" />
              {todo.projects.slice(0, 2).map((project: any) => (
                <Badge
                  key={project.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: `${project.color}60`,
                    color: project.color,
                  }}
                >
                  {project.name}
                </Badge>
              ))}
              {todo.projects.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{todo.projects.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {todo.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {todo.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div
        className={cn(
          'flex items-center gap-1 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(todo)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(todo.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
