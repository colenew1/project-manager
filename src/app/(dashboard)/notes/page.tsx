'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { Plus, Search, X, Pin, PinOff, Pencil, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MoreHorizontal } from 'lucide-react';
import { useNotes } from '@/hooks/use-notes';
import { useProjects } from '@/hooks/use-projects';
import { Note, Project } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotesPage() {
  const { notes, isLoading, createNote, updateNote, deleteNote, togglePin } = useNotes();
  const { projects } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formProjectIds, setFormProjectIds] = useState<string[]>([]);

  // Filter notes by search
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;

    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const matchesTitle = note.title.toLowerCase().includes(query);
      const matchesContent = note.content?.toLowerCase().includes(query);
      const matchesProjects = note.projects?.some((p) => p.name.toLowerCase().includes(query));
      return matchesTitle || matchesContent || matchesProjects;
    });
  }, [notes, searchQuery]);

  // Separate pinned and unpinned
  const pinnedNotes = filteredNotes.filter((n) => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.is_pinned);

  const openCreateForm = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormProjectIds([]);
    setIsFormOpen(true);
  };

  const openEditForm = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content || '');
    setFormProjectIds(note.projects?.map((p) => p.id) || []);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingNote) {
        await updateNote.mutateAsync({
          id: editingNote.id,
          title: formTitle,
          content: formContent,
          project_ids: formProjectIds,
        });
        toast.success('Note updated');
      } else {
        await createNote.mutateAsync({
          title: formTitle,
          content: formContent,
          project_ids: formProjectIds,
        });
        toast.success('Note created');
      }
      setIsFormOpen(false);
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleDelete = async (note: Note) => {
    if (confirm(`Delete "${note.title}"?`)) {
      try {
        await deleteNote.mutateAsync(note.id);
        toast.success('Note deleted');
      } catch (error) {
        toast.error('Failed to delete note');
      }
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await togglePin.mutateAsync({ id: note.id, is_pinned: !note.is_pinned });
      toast.success(note.is_pinned ? 'Note unpinned' : 'Note pinned');
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const toggleProjectLink = (projectId: string) => {
    setFormProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const NoteCard = ({ note }: { note: Note }) => (
    <Card className="group relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {note.is_pinned && (
              <Pin className="h-4 w-4 text-primary flex-shrink-0" />
            )}
            <h3 className="font-semibold truncate">{note.title}</h3>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditForm(note)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTogglePin(note)}>
                {note.is_pinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(note)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {note.content && (
          <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
            {note.content}
          </p>
        )}

        {note.projects && note.projects.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.projects.map((project) => (
              <Badge
                key={project.id}
                variant="outline"
                className="text-xs"
                style={{
                  backgroundColor: `${project.color}15`,
                  borderColor: `${project.color}40`,
                }}
              >
                {project.icon && <span className="mr-1">{project.icon}</span>}
                {project.name}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {new Date(note.updated_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Header title="Notes" />

      <div className="p-4 md:p-6">
        {/* Actions Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex-1" />

          <Button onClick={openCreateForm}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No notes yet</h3>
            <p className="mb-4 text-muted-foreground">
              Create your first note to get started.
            </p>
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          </div>
        )}

        {/* No Search Results */}
        {!isLoading && notes.length > 0 && filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold">No matching notes</h3>
            <p className="mb-4 text-muted-foreground">
              Try adjusting your search query.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear search
            </Button>
          </div>
        )}

        {/* Notes Grid */}
        {!isLoading && filteredNotes.length > 0 && (
          <div className="space-y-6">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Pinned
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes */}
            {unpinnedNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">
                    Other
                  </h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {unpinnedNotes.map((note) => (
                    <NoteCard key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-lg font-medium"
              />
            </div>

            <div>
              <Textarea
                placeholder="Write your note..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>

            {/* Link to Projects */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Link to Projects
                    {formProjectIds.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                        {formProjectIds.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {projects.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        No projects available
                      </p>
                    ) : (
                      projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => toggleProjectLink(project.id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                            formProjectIds.includes(project.id) && 'bg-muted'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border',
                              formProjectIds.includes(project.id)
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-muted-foreground/30'
                            )}
                          >
                            {formProjectIds.includes(project.id) && (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                          <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">
                            {project.icon && <span className="mr-1">{project.icon}</span>}
                            {project.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Show linked projects */}
              {formProjectIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formProjectIds.map((id) => {
                    const project = projects.find((p) => p.id === id);
                    if (!project) return null;
                    return (
                      <Badge
                        key={id}
                        variant="outline"
                        className="text-xs gap-1"
                        style={{
                          backgroundColor: `${project.color}15`,
                          borderColor: `${project.color}40`,
                        }}
                      >
                        {project.icon && <span>{project.icon}</span>}
                        {project.name}
                        <button
                          onClick={() => toggleProjectLink(id)}
                          className="hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingNote ? 'Save Changes' : 'Create Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
