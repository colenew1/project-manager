'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { Plus, LayoutGrid, List, Search, X, Check } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectForm } from '@/components/projects/project-form';
import { useProjects } from '@/hooks/use-projects';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Project, ProjectStatus } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: 'Idea', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  under_construction: { label: 'Under Construction', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  active: { label: 'Active', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  paused: { label: 'Paused', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  completed: { label: 'Completed', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  archived: { label: 'Archived', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const allStatuses: ProjectStatus[] = ['under_construction', 'active', 'completed', 'idea', 'paused', 'archived'];

export default function ProjectsPage() {
  const { projects, isLoading, createProjectWithLinks, updateProjectWithLinks, deleteProject } = useProjects();
  const { projectView, setProjectView, quickAddOpen, quickAddType, closeQuickAdd } = useUIStore();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Status sort order: under_construction, active, completed, idea, paused, archived
  const statusOrder: Record<string, number> = {
    under_construction: 0,
    active: 1,
    completed: 2,
    idea: 3,
    paused: 4,
    archived: 5,
  };

  // Toggle status in filter
  const toggleStatus = (status: ProjectStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedStatuses([]);
    setSearchQuery('');
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // Status filter (if any selected)
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(project.status)) {
          return false;
        }

        // Search filter
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
      .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [projects, selectedStatuses, searchQuery]);

  // Handle form submission
  const handleCreateProject = async (data: any) => {
    const { additional_links, ...projectData } = data;
    await createProjectWithLinks.mutateAsync({
      ...projectData,
      links: additional_links,
    });
  };

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
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject.mutateAsync(project.id);
    }
  };

  // Handle quick add from command palette
  const isQuickAddOpen = quickAddOpen && quickAddType === 'project';

  return (
    <>
      <Header title="Projects" />

      <div className="p-4 md:p-6">
        {/* Actions Bar */}
        <div className="mb-6 space-y-4">
          {/* Top row: Search, Status Filter, View Toggle, New Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
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

            {/* Status Multi-Select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Status
                  {selectedStatuses.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  {allStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                        selectedStatuses.includes(status) && 'bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          selectedStatuses.includes(status)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {selectedStatuses.includes(status) && <Check className="h-3 w-3" />}
                      </div>
                      <Badge variant="outline" className={cn('text-xs', statusConfig[status].className)}>
                        {statusConfig[status].label}
                      </Badge>
                    </button>
                  ))}
                </div>
                {selectedStatuses.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setSelectedStatuses([])}
                    >
                      Clear selection
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

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

            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Active Filters Display */}
          {(selectedStatuses.length > 0 || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedStatuses.map((status) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={cn('gap-1', statusConfig[status].className)}
                >
                  {statusConfig[status].label}
                  <button onClick={() => toggleStatus(status)} className="ml-1 hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                Clear all
              </Button>
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
        {!isLoading && filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">
              {selectedStatuses.length > 0 || searchQuery ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="mb-4 text-muted-foreground">
              {selectedStatuses.length > 0 || searchQuery
                ? 'Try adjusting your filters or search query.'
                : 'Create your first project to get started.'}
            </p>
            {selectedStatuses.length === 0 && !searchQuery ? (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            ) : (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}

        {/* Project Grid/List */}
        {!isLoading && filteredProjects.length > 0 && (
          <div
            className={cn(
              projectView === 'grid'
                ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'flex flex-col gap-4'
            )}
          >
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => {
                  setEditingProject(p);
                  setIsFormOpen(true);
                }}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Form Modal */}
      <ProjectForm
        open={isFormOpen || isQuickAddOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
          closeQuickAdd();
        }}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject || undefined}
        mode={editingProject ? 'edit' : 'create'}
      />
    </>
  );
}
