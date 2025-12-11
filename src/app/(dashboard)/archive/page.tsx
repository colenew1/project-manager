'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { LayoutGrid, List, Search, X, ArchiveRestore } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectForm } from '@/components/projects/project-form';
import { useProjects } from '@/hooks/use-projects';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Project } from '@/types';

export default function ArchivePage() {
  const { projects, isLoading, updateProjectWithLinks, deleteProject, toggleFavorite } = useProjects();
  const { projectView, setProjectView } = useUIStore();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter archived projects only
  const archivedProjects = useMemo(() => {
    return projects
      .filter((project) => {
        if (project.status !== 'archived') return false;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = project.name.toLowerCase().includes(query);
          const matchesDescription = project.description?.toLowerCase().includes(query);
          const matchesTags = project.tags?.some((tag) => tag.name.toLowerCase().includes(query));
          const matchesCategories = project.categories?.some((cat) => cat.toLowerCase().includes(query));

          if (!matchesName && !matchesDescription && !matchesTags && !matchesCategories) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [projects, searchQuery]);

  const handleUpdateProject = async (data: any) => {
    if (editingProject) {
      const { additional_links, ...projectData } = data;
      await updateProjectWithLinks.mutateAsync({
        id: editingProject.id,
        ...projectData,
        links: additional_links,
      });
      setEditingProject(null);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (confirm(`Are you sure you want to permanently delete "${project.name}"?`)) {
      await deleteProject.mutateAsync(project.id);
    }
  };

  const handleToggleFavorite = async (project: Project) => {
    await toggleFavorite.mutateAsync({ id: project.id, is_favorite: !project.is_favorite });
  };

  const handleRestoreProject = async (project: Project) => {
    await updateProjectWithLinks.mutateAsync({
      id: project.id,
      status: 'paused',
    });
  };

  return (
    <>
      <Header title="Archive" />

      <div className="p-4 md:p-6">
        {/* Actions Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search archived projects..."
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

            {/* View Toggle */}
            <div className="hidden sm:flex items-center rounded-lg border border-border">
              <Button
                variant={projectView === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setProjectView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={projectView === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setProjectView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {searchQuery && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              <Badge variant="secondary" className="gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && archivedProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <ArchiveRestore className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {searchQuery ? 'No matching archived projects' : 'No archived projects'}
            </h3>
            <p className="mb-4 text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Projects you archive will appear here.'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Project Grid/List */}
        {!isLoading && archivedProjects.length > 0 && (
          <div
            className={cn(
              projectView === 'grid'
                ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col gap-4'
            )}
          >
            {archivedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => {
                  setEditingProject(p);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteProject}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      <ProjectForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleUpdateProject}
        project={editingProject || undefined}
        mode="edit"
      />
    </>
  );
}
