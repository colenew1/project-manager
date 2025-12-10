'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Note, NoteProject } from '@/types';

export function useNotes() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all notes with their linked projects
  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          note_projects (
            project_id,
            projects:project_id (
              id,
              name,
              color,
              icon
            )
          )
        `)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten projects
      return (data || []).map((note: any) => ({
        ...note,
        projects: note.note_projects?.map((np: any) => np.projects).filter(Boolean) || [],
      })) as Note[];
    },
  });

  // Create a new note
  const createNote = useMutation({
    mutationFn: async ({
      title,
      content,
      is_pinned = false,
      project_ids = [],
    }: {
      title: string;
      content?: string;
      is_pinned?: boolean;
      project_ids?: string[];
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the note
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({ title, content, is_pinned, user_id: user.id })
        .select()
        .single();

      if (noteError) throw noteError;

      // Link to projects if any
      if (project_ids.length > 0) {
        const { error: linkError } = await supabase
          .from('note_projects')
          .insert(project_ids.map((project_id) => ({
            note_id: note.id,
            project_id,
          })));

        if (linkError) throw linkError;
      }

      return note as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  // Update a note
  const updateNote = useMutation({
    mutationFn: async ({
      id,
      title,
      content,
      is_pinned,
      project_ids,
    }: {
      id: string;
      title?: string;
      content?: string;
      is_pinned?: boolean;
      project_ids?: string[];
    }) => {
      // Update note fields
      const updates: any = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (is_pinned !== undefined) updates.is_pinned = is_pinned;

      const { data: note, error: noteError } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (noteError) throw noteError;

      // Update project links if provided
      if (project_ids !== undefined) {
        // Remove existing links
        await supabase
          .from('note_projects')
          .delete()
          .eq('note_id', id);

        // Add new links
        if (project_ids.length > 0) {
          const { error: linkError } = await supabase
            .from('note_projects')
            .insert(project_ids.map((project_id) => ({
              note_id: id,
              project_id,
            })));

          if (linkError) throw linkError;
        }
      }

      return note as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  // Delete a note
  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  // Toggle pin status
  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  return {
    notes,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
  };
}
