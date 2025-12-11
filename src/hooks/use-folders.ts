'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ProjectFolder } from '@/types';
import { toast } from 'sonner';

export function useFolders() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all folders
  const {
    data: folders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_folders')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      return data as ProjectFolder[];
    },
  });

  // Create folder
  const createFolder = useMutation({
    mutationFn: async (newFolder: Partial<ProjectFolder>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('project_folders')
        .insert({
          ...newFolder,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder created');
    },
    onError: (error) => {
      toast.error('Failed to create folder');
      console.error(error);
    },
  });

  // Update folder
  const updateFolder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectFolder> & { id: string }) => {
      const { data, error } = await supabase
        .from('project_folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Folder updated');
    },
    onError: (error) => {
      toast.error('Failed to update folder');
      console.error(error);
    },
  });

  // Delete folder
  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('project_folders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Folder deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete folder');
      console.error(error);
    },
  });

  return {
    folders: folders || [],
    isLoading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
