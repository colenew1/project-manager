'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Project, ProjectStatus, ProjectLink } from '@/types';
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
          ),
          links:project_links(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten the nested structure
      return data.map((project: any) => ({
        ...project,
        tags: project.tags?.map((pt: any) => pt.tag).filter(Boolean) || [],
        todos: project.todos?.map((tp: any) => tp.todo).filter(Boolean) || [],
        links: project.links || [],
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

  // Add project link
  const addProjectLink = useMutation({
    mutationFn: async ({
      project_id,
      label,
      url,
    }: {
      project_id: string;
      label: string;
      url: string;
    }) => {
      const { data, error } = await supabase
        .from('project_links')
        .insert({ project_id, label, url })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Failed to add link');
      console.error(error);
    },
  });

  // Delete project link
  const deleteProjectLink = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from('project_links').delete().eq('id', linkId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error('Failed to delete link');
      console.error(error);
    },
  });

  // Update project with links (helper that handles both project and links)
  const updateProjectWithLinks = useMutation({
    mutationFn: async ({
      id,
      links,
      ...updates
    }: Partial<Project> & { id: string; links?: { label: string; url: string }[] }) => {
      console.log('updateProjectWithLinks called with:', { id, links, updates });

      // Update project
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project:', error);
        throw error;
      }

      // Handle links if provided
      if (links !== undefined) {
        console.log('Processing links:', links);

        // Delete existing links
        const { error: deleteError } = await supabase.from('project_links').delete().eq('project_id', id);
        if (deleteError) {
          console.error('Error deleting links:', deleteError);
          throw deleteError;
        }

        // Insert new links
        if (links.length > 0) {
          const linksToInsert = links.map((link) => ({
            project_id: id,
            label: link.label,
            url: link.url,
          }));
          console.log('Inserting new links:', linksToInsert);
          const { data: insertedLinks, error: linkError } = await supabase
            .from('project_links')
            .insert(linksToInsert)
            .select();

          console.log('Insert result:', { insertedLinks, linkError });

          if (linkError) {
            console.error('Error inserting links:', linkError);
            throw linkError;
          }
        }
      }

      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update project');
      console.error(error);
    },
  });

  // Create project with links
  const createProjectWithLinks = useMutation({
    mutationFn: async ({
      links,
      ...newProject
    }: Partial<Project> & { links?: { label: string; url: string }[] }) => {
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

      // Insert links if provided
      if (links && links.length > 0) {
        const { error: linkError } = await supabase.from('project_links').insert(
          links.map((link) => ({
            project_id: data.id,
            label: link.label,
            url: link.url,
          }))
        );
        if (linkError) throw linkError;
      }

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

  return {
    projects: projects || [],
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
    updateProjectPosition,
    addProjectLink,
    deleteProjectLink,
    updateProjectWithLinks,
    createProjectWithLinks,
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
          ),
          links:project_links(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        tags: data.tags?.map((pt: any) => pt.tag).filter(Boolean) || [],
        todos: data.todos?.map((tp: any) => tp.todo).filter(Boolean) || [],
        links: data.links || [],
      } as Project;
    },
    enabled: !!id,
  });
}
