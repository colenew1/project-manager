'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Filter, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { TodoInput } from '@/components/todos/todo-input';
import { TodoItem } from '@/components/todos/todo-item';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTodos } from '@/hooks/use-todos';
import { useProjects } from '@/hooks/use-projects';
import { Todo, TodoPriority } from '@/types';
import { isOverdue } from '@/lib/utils/date-parser';

type FilterType = 'all' | 'pending' | 'completed' | 'overdue';
type SortType = 'due_date' | 'priority' | 'created';

export default function TodosPage() {
  const { todos, isLoading, createTodo, toggleTodo, deleteTodo } = useTodos();
  const { projects } = useProjects();

  const [filter, setFilter] = useState<FilterType>('pending');
  const [sortBy, setSortBy] = useState<SortType>('due_date');
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'all'>('all');

  // Filter todos
  const filteredTodos = todos.filter((todo) => {
    // Status filter
    if (filter === 'pending' && todo.is_completed) return false;
    if (filter === 'completed' && !todo.is_completed) return false;
    if (filter === 'overdue') {
      if (todo.is_completed) return false;
      if (!todo.due_date) return false;
      if (!isOverdue(todo.due_date)) return false;
    }

    // Priority filter
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false;

    return true;
  });

  // Sort todos
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === 'due_date') {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }

    if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }

    // created
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleCreateTodo = async (data: {
    title: string;
    due_date?: string | null;
    priority: TodoPriority;
    project_ids: string[];
  }) => {
    await createTodo.mutateAsync(data);
  };

  const handleToggleTodo = async (id: string, is_completed: boolean) => {
    await toggleTodo.mutateAsync({ id, is_completed });
  };

  const handleDeleteTodo = async (id: string) => {
    if (confirm('Delete this todo?')) {
      await deleteTodo.mutateAsync(id);
    }
  };

  // Stats
  const pendingCount = todos.filter((t) => !t.is_completed).length;
  const overdueCount = todos.filter(
    (t) => !t.is_completed && t.due_date && isOverdue(t.due_date)
  ).length;
  const completedTodayCount = todos.filter((t) => {
    if (!t.completed_at) return false;
    const completedDate = new Date(t.completed_at);
    const today = new Date();
    return completedDate.toDateString() === today.toDateString();
  }).length;

  return (
    <>
      <Header title="Todos" />

      <div className="p-4 md:p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-2">
                <Circle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2">
                <Clock className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueCount}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTodayCount}</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Todo */}
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <TodoInput onSubmit={handleCreateTodo} projects={projects} />
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">
                Pending {pendingCount > 0 && `(${pendingCount})`}
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Overdue {overdueCount > 0 && `(${overdueCount})`}
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TodoPriority | 'all')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Todo List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : sortedTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              {filter === 'pending'
                ? 'All caught up!'
                : filter === 'overdue'
                ? 'No overdue todos'
                : 'No todos found'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'pending'
                ? 'You have no pending todos.'
                : filter === 'overdue'
                ? 'Great job staying on top of things!'
                : 'Add a todo to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
