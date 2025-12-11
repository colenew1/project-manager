'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo } from 'react';
import { Plus, LayoutGrid, List, Search, X, Check, Star, Clock, FolderOpen, Code2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectForm } from '@/components/projects/project-form';
import { useProjects } from '@/hooks/use-projects';
import { useFolders } from '@/hooks/use-folders';
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
  const { projects, isLoading, createProjectWithLinks, updateProjectWithLinks, deleteProject, toggleFavorite } = useProjects();
  const { folders } = useFolders();
  const { projectView, setProjectView, quickAddOpen, quickAddType, closeQuickAdd } = useUIStore();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showRecentOnly, setShowRecentOnly] = useState(false);
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

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

  // Toggle tech stack selection
  const toggleTechStack = (tagName: string) => {
    setSelectedTechStacks((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedStatuses([]);
    setSearchQuery('');
    setShowFavoritesOnly(false);
    setShowRecentOnly(false);
    setSelectedTechStacks([]);
    setSelectedFolderId(null);
  };

  // Get unique tech stack tags from all projects
  const allTechStacks = useMemo(() => {
    const techStackMap = new Map<string, { name: string; color: string }>();
    projects.forEach((project) => {
      project.tags?.forEach((tag) => {
        if (tag.is_tech_stack && !techStackMap.has(tag.name)) {
          techStackMap.set(tag.name, { name: tag.name, color: tag.color });
        }
      });
    });
    return Array.from(techStackMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  // Get recent projects (accessed in last 7 days or updated in last 7 days)
  const recentProjects = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return projects.filter((project) => {
      const lastAccessed = project.last_accessed_at ? new Date(project.last_accessed_at) : null;
      const updated = new Date(project.updated_at);
      return (lastAccessed && lastAccessed > sevenDaysAgo) || updated > sevenDaysAgo;
    }).sort((a, b) => {
      const aDate = a.last_accessed_at ? new Date(a.last_accessed_at) : new Date(a.updated_at);
      const bDate = b.last_accessed_at ? new Date(b.last_accessed_at) : new Date(b.updated_at);
      return bDate.getTime() - aDate.getTime();
    }).slice(0, 5);
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((project) => {
      // Favorites filter
      if (showFavoritesOnly && !project.is_favorite) {
        return false;
      }

      // Recent filter
      if (showRecentOnly) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const lastAccessed = project.last_accessed_at ? new Date(project.last_accessed_at) : null;
        const updated = new Date(project.updated_at);
        if (!((lastAccessed && lastAccessed > sevenDaysAgo) || updated > sevenDaysAgo)) {
          return false;
        }
      }

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

      // Tech stack filter
      if (selectedTechStacks.length > 0) {
        const projectTechStacks = project.tags?.filter((t) => t.is_tech_stack).map((t) => t.name) || [];
        const hasSelectedTech = selectedTechStacks.some((tech) => projectTechStacks.includes(tech));
        if (!hasSelectedTech) {
          return false;
        }
      }

      // Folder filter
      if (selectedFolderId !== null) {
        if (selectedFolderId === 'unfiled') {
          if (project.folder_id !== null) return false;
        } else {
          if (project.folder_id !== selectedFolderId) return false;
        }
      }

      return true;
    });

    // Sort: favorites first, then by status order
    return filtered.sort((a, b) => {
      // Favorites always first
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      // Then by status order
      return statusOrder[a.status] - statusOrder[b.status];
    });
  }, [projects, selectedStatuses, searchQuery, showFavoritesOnly, showRecentOnly, selectedTechStacks, selectedFolderId]);

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

  const handleToggleFavorite = async (project: Project) => {
    await toggleFavorite.mutateAsync({ id: project.id, is_favorite: !project.is_favorite });
  };

  const hasActiveFilters = selectedStatuses.length > 0 || searchQuery || showFavoritesOnly || showRecentOnly || selectedTechStacks.length > 0 || selectedFolderId !== null;

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

            {/* Favorites Toggle */}
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-1.5"
            >
              <Star className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
              <span className="hidden sm:inline">Favorites</span>
            </Button>

            {/* Recent Toggle */}
            <Button
              variant={showRecentOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowRecentOnly(!showRecentOnly)}
              className="gap-1.5"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Recent</span>
            </Button>

            {/* Status Multi-Select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
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

            {/* Tech Stack Multi-Select */}
            {allTechStacks.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Code2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Tech</span>
                    {selectedTechStacks.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                        {selectedTechStacks.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {allTechStacks.map((tech) => (
                      <button
                        key={tech.name}
                        onClick={() => toggleTechStack(tech.name)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                          selectedTechStacks.includes(tech.name) && 'bg-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            selectedTechStacks.includes(tech.name)
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {selectedTechStacks.includes(tech.name) && <Check className="h-3 w-3" />}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{
                            backgroundColor: `${tech.color}20`,
                            borderColor: `${tech.color}40`,
                            color: tech.color,
                          }}
                        >
                          {tech.name}
                        </Badge>
                      </button>
                    ))}
                  </div>
                  {selectedTechStacks.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setSelectedTechStacks([])}
                      >
                        Clear selection
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Folder Filter */}
            {folders.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FolderOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Folder</span>
                    {selectedFolderId !== null && (
                      <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                        1
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedFolderId(selectedFolderId === 'unfiled' ? null : 'unfiled')}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                        selectedFolderId === 'unfiled' && 'bg-muted'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded border',
                          selectedFolderId === 'unfiled'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30'
                        )}
                      >
                        {selectedFolderId === 'unfiled' && <Check className="h-3 w-3" />}
                      </div>
                      <span className="text-muted-foreground">Unfiled</span>
                    </button>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                          selectedFolderId === folder.id && 'bg-muted'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-4 w-4 items-center justify-center rounded border',
                            selectedFolderId === folder.id
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/30'
                          )}
                        >
                          {selectedFolderId === folder.id && <Check className="h-3 w-3" />}
                        </div>
                        <div
                          className="h-3 w-3 rounded"
                          style={{ backgroundColor: folder.color }}
                        />
                        <span>{folder.name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedFolderId !== null && (
                    <div className="mt-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setSelectedFolderId(null)}
                      >
                        Clear selection
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

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
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {showFavoritesOnly && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Favorites
                  <button onClick={() => setShowFavoritesOnly(false)} className="ml-1 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {showRecentOnly && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Recent
                  <button onClick={() => setShowRecentOnly(false)} className="ml-1 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
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
              {selectedTechStacks.map((tech) => {
                const techData = allTechStacks.find((t) => t.name === tech);
                return (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="gap-1"
                    style={techData ? {
                      backgroundColor: `${techData.color}20`,
                      borderColor: `${techData.color}40`,
                      color: techData.color,
                    } : undefined}
                  >
                    <Code2 className="h-3 w-3" />
                    {tech}
                    <button onClick={() => toggleTechStack(tech)} className="ml-1 hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              {selectedFolderId !== null && (
                <Badge variant="secondary" className="gap-1">
                  <FolderOpen className="h-3 w-3" />
                  {selectedFolderId === 'unfiled' ? 'Unfiled' : folders.find((f) => f.id === selectedFolderId)?.name || 'Folder'}
                  <button onClick={() => setSelectedFolderId(null)} className="ml-1 hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
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
              {hasActiveFilters ? 'No matching projects' : 'No projects yet'}
            </h3>
            <p className="mb-4 text-muted-foreground">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Create your first project to get started.'}
            </p>
            {!hasActiveFilters ? (
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
                onToggleFavorite={handleToggleFavorite}
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
