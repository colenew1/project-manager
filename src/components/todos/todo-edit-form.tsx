'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Todo, TodoPriority } from '@/types';

interface TodoEditFormData {
  title: string;
  description: string;
  due_date: string;
  priority: TodoPriority;
}

interface TodoEditFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { id: string; title: string; description?: string; due_date?: string | null; priority: TodoPriority }) => Promise<void>;
  todo: Todo | null;
}

const priorityOptions: { value: TodoPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export function TodoEditForm({ open, onClose, onSubmit, todo }: TodoEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TodoEditFormData>({
    defaultValues: {
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
    },
  });

  const priority = watch('priority');

  // Reset form when todo changes
  useEffect(() => {
    if (open && todo) {
      reset({
        title: todo.title || '',
        description: todo.description || '',
        due_date: todo.due_date ? todo.due_date.split('T')[0] : '',
        priority: todo.priority || 'medium',
      });
    }
  }, [open, todo, reset]);

  const handleFormSubmit = async (data: TodoEditFormData) => {
    if (!todo) return;

    setIsLoading(true);
    try {
      await onSubmit({
        id: todo.id,
        title: data.title,
        description: data.description || undefined,
        due_date: data.due_date || null,
        priority: data.priority,
      });
      onClose();
    } catch (error) {
      console.error('Error updating todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!todo) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogDescription>
            Update the todo details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="What needs to be done?"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Due Date & Priority */}
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date')}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setValue('priority', value as TodoPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
