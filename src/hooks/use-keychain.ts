'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { KeychainGroup, KeychainEntry, KeyEnvironment, Project } from '@/types';
import { toast } from 'sonner';

interface CreateGroupData {
  name: string;
  service?: string | null;
  environment: KeyEnvironment;
  notes?: string | null;
  is_favorite?: boolean;
  entries: { label: string; value: string }[];
  project_ids: string[];
}

interface UpdateGroupData extends CreateGroupData {
  id: string;
}

export function useKeychain() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all keychain groups with entries and linked projects
  const {
    data: groups = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['keychain-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('keychain_groups')
        .select(`
          *,
          entries:keychain_entries(*),
          projects:keychain_group_projects(
            project:projects(*)
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten the nested structure
      return data.map((group: any) => ({
        ...group,
        entries: group.entries || [],
        projects: group.projects?.map((gp: any) => gp.project).filter(Boolean) || [],
      })) as KeychainGroup[];
    },
  });

  // Create a new keychain group with entries and project links
  const createGroup = useMutation({
    mutationFn: async (data: CreateGroupData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('keychain_groups')
        .insert({
          user_id: user.user.id,
          name: data.name,
          service: data.service,
          environment: data.environment,
          notes: data.notes,
          is_favorite: data.is_favorite || false,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Create entries
      if (data.entries.length > 0) {
        const { error: entriesError } = await supabase
          .from('keychain_entries')
          .insert(
            data.entries.map((entry) => ({
              group_id: group.id,
              label: entry.label,
              value: entry.value,
            }))
          );

        if (entriesError) throw entriesError;
      }

      // Link projects
      if (data.project_ids.length > 0) {
        const { error: projectsError } = await supabase
          .from('keychain_group_projects')
          .insert(
            data.project_ids.map((projectId) => ({
              group_id: group.id,
              project_id: projectId,
            }))
          );

        if (projectsError) throw projectsError;
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keychain-groups'] });
      toast.success('Keychain group created');
    },
    onError: (error) => {
      console.error('Error creating keychain group:', error);
      toast.error('Failed to create keychain group');
    },
  });

  // Update a keychain group
  const updateGroup = useMutation({
    mutationFn: async (data: UpdateGroupData) => {
      // Update the group
      const { error: groupError } = await supabase
        .from('keychain_groups')
        .update({
          name: data.name,
          service: data.service,
          environment: data.environment,
          notes: data.notes,
          is_favorite: data.is_favorite,
        })
        .eq('id', data.id);

      if (groupError) throw groupError;

      // Delete existing entries and recreate
      const { error: deleteEntriesError } = await supabase
        .from('keychain_entries')
        .delete()
        .eq('group_id', data.id);

      if (deleteEntriesError) throw deleteEntriesError;

      // Create new entries
      if (data.entries.length > 0) {
        const { error: entriesError } = await supabase
          .from('keychain_entries')
          .insert(
            data.entries.map((entry) => ({
              group_id: data.id,
              label: entry.label,
              value: entry.value,
            }))
          );

        if (entriesError) throw entriesError;
      }

      // Delete existing project links and recreate
      const { error: deleteProjectsError } = await supabase
        .from('keychain_group_projects')
        .delete()
        .eq('group_id', data.id);

      if (deleteProjectsError) throw deleteProjectsError;

      // Create new project links
      if (data.project_ids.length > 0) {
        const { error: projectsError } = await supabase
          .from('keychain_group_projects')
          .insert(
            data.project_ids.map((projectId) => ({
              group_id: data.id,
              project_id: projectId,
            }))
          );

        if (projectsError) throw projectsError;
      }

      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keychain-groups'] });
      toast.success('Keychain group updated');
    },
    onError: (error) => {
      console.error('Error updating keychain group:', error);
      toast.error('Failed to update keychain group');
    },
  });

  // Toggle favorite status
  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from('keychain_groups')
        .update({ is_favorite })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keychain-groups'] });
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    },
  });

  // Delete a keychain group
  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('keychain_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keychain-groups'] });
      toast.success('Keychain group deleted');
    },
    onError: (error) => {
      console.error('Error deleting keychain group:', error);
      toast.error('Failed to delete keychain group');
    },
  });

  return {
    groups,
    isLoading,
    error,
    createGroup,
    updateGroup,
    toggleFavorite,
    deleteGroup,
  };
}
