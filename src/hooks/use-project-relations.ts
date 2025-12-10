'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { ProjectRelation, RelationType } from '@/types';

export function useProjectRelations() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all project relations
  const {
    data: relations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['project-relations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_relations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ProjectRelation[];
    },
  });

  // Create a new relation (connection)
  const createRelation = useMutation({
    mutationFn: async ({
      source_id,
      target_id,
      relation_type = 'related_to',
      label,
      source_handle,
      target_handle,
    }: {
      source_id: string;
      target_id: string;
      relation_type?: RelationType;
      label?: string;
      source_handle?: string | null;
      target_handle?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('project_relations')
        .insert({
          source_id,
          target_id,
          relation_type,
          label,
          source_handle,
          target_handle,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectRelation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-relations'] });
    },
    onError: (error) => {
      console.error('Error creating relation:', error);
    },
  });

  // Delete a relation
  const deleteRelation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_relations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-relations'] });
    },
    onError: (error) => {
      console.error('Error deleting relation:', error);
    },
  });

  // Delete relation by source and target
  const deleteRelationByNodes = useMutation({
    mutationFn: async ({
      source_id,
      target_id,
    }: {
      source_id: string;
      target_id: string;
    }) => {
      const { error } = await supabase
        .from('project_relations')
        .delete()
        .eq('source_id', source_id)
        .eq('target_id', target_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-relations'] });
    },
    onError: (error) => {
      console.error('Error deleting relation:', error);
    },
  });

  return {
    relations,
    isLoading,
    error,
    createRelation,
    deleteRelation,
    deleteRelationByNodes,
  };
}
