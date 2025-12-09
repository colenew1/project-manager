'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Project, ProjectStatus } from '@/types';
import { toast } from 'sonner';

export function useProjects() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all projects
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          tags:project_tags(
            tag:tags(*)
          ),
          todos:todo_projects(
            todo:todos(*)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten the nested structure
      return data.map((project: any) => ({
        ...project,
        tags: project.tags?.map((pt: any) => pt.tag).filter(Boolean) || [],
        todos: project.todos?.map((tp: any) => tp.todo).filter(Boolean) || [],
      })) as Project[];
    },
  });

  // Create project
  const createProject = useMutation({
    mutationFn: async (newProject: Partial<Project>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...newProject,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create project');
      console.error(error);
    },
  });

  // Update project
  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update project');
      console.error(error);
    },
  });

  // Delete project
  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete project');
      console.error(error);
    },
  });

  // Update project position (for map)
  const updateProjectPosition = useMutation({
    mutationFn: async ({
      id,
      position_x,
      position_y,
    }: {
      id: string;
      position_x: number;
      position_y: number;
    }) => {
      const { error } = await supabase
        .from('projects')
        .update({ position_x, position_y })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects: projects || [],
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    updateProjectPosition,
  };
}

// Fetch single project
export function useProject(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          tags:project_tags(
            tag:tags(*)
          ),
          todos:todo_projects(
            todo:todos(*)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        tags: data.tags?.map((pt: any) => pt.tag).filter(Boolean) || [],
        todos: data.todos?.map((tp: any) => tp.todo).filter(Boolean) || [],
      } as Project;
    },
    enabled: !!id,
  });
}
