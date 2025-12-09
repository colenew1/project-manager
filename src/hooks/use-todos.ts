'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Todo, TodoPriority } from '@/types';
import { toast } from 'sonner';

interface CreateTodoData {
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: TodoPriority;
  project_ids?: string[]; // Can link to multiple projects
  recurrence_rule?: string;
}

interface UpdateTodoData extends Partial<CreateTodoData> {
  id: string;
  is_completed?: boolean;
}

export function useTodos(projectId?: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch todos (optionally filtered by project)
  const {
    data: todos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['todos', projectId],
    queryFn: async () => {
      let query = supabase.from('todos').select(`
        *,
        projects:todo_projects(
          project:projects(id, name, color)
        )
      `);

      if (projectId) {
        // Get todos linked to this specific project
        const { data: todoProjects } = await supabase
          .from('todo_projects')
          .select('todo_id')
          .eq('project_id', projectId);

        const todoIds = todoProjects?.map((tp: { todo_id: string }) => tp.todo_id) || [];

        if (todoIds.length === 0) {
          return [];
        }

        query = query.in('id', todoIds);
      }

      const { data, error } = await query.order('position').order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((todo: any) => ({
        ...todo,
        projects: todo.projects?.map((tp: any) => tp.project).filter(Boolean) || [],
      })) as Todo[];
    },
  });

  // Create todo
  const createTodo = useMutation({
    mutationFn: async (newTodo: CreateTodoData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { project_ids, ...todoData } = newTodo;

      // Create the todo
      const { data: todo, error: todoError } = await supabase
        .from('todos')
        .insert({
          ...todoData,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (todoError) throw todoError;

      // Link to projects if specified
      if (project_ids && project_ids.length > 0) {
        const todoProjects = project_ids.map((projectId) => ({
          todo_id: todo.id,
          project_id: projectId,
        }));

        const { error: linkError } = await supabase
          .from('todo_projects')
          .insert(todoProjects);

        if (linkError) throw linkError;
      }

      return todo as Todo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Todo created');
    },
    onError: (error) => {
      toast.error('Failed to create todo');
      console.error(error);
    },
  });

  // Update todo
  const updateTodo = useMutation({
    mutationFn: async ({ id, project_ids, ...updates }: UpdateTodoData) => {
      // Update todo fields
      const { data: todo, error: todoError } = await supabase
        .from('todos')
        .update({
          ...updates,
          completed_at: updates.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (todoError) throw todoError;

      // Update project links if specified
      if (project_ids !== undefined) {
        // Remove existing links
        await supabase.from('todo_projects').delete().eq('todo_id', id);

        // Add new links
        if (project_ids.length > 0) {
          const todoProjects = project_ids.map((projectId) => ({
            todo_id: id,
            project_id: projectId,
          }));

          const { error: linkError } = await supabase
            .from('todo_projects')
            .insert(todoProjects);

          if (linkError) throw linkError;
        }
      }

      return todo as Todo;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (variables.is_completed !== undefined) {
        toast.success(variables.is_completed ? 'Todo completed' : 'Todo reopened');
      } else {
        toast.success('Todo updated');
      }
    },
    onError: (error) => {
      toast.error('Failed to update todo');
      console.error(error);
    },
  });

  // Delete todo
  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Todo deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete todo');
      console.error(error);
    },
  });

  // Toggle todo completion
  const toggleTodo = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from('todos')
        .update({
          is_completed,
          completed_at: is_completed ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(variables.is_completed ? 'Todo completed' : 'Todo reopened');
    },
    onError: (error) => {
      toast.error('Failed to update todo');
      console.error(error);
    },
  });

  return {
    todos: todos || [],
    isLoading,
    error,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
  };
}
