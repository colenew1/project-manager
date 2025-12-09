'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Plus, LayoutGrid, List, Filter } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectForm } from '@/components/projects/project-form';
import { useProjects } from '@/hooks/use-projects';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Project, ProjectStatus } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProjectsPage() {
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  const { projectView, setProjectView, quickAddOpen, quickAddType, closeQuickAdd } = useUIStore();

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    if (statusFilter === 'all') return true;
    return project.status === statusFilter;
  });

  // Handle form submission
  const handleCreateProject = async (data: any) => {
    await createProject.mutateAsync(data);
  };

  const handleUpdateProject = async (data: any) => {
    if (editingProject) {
      await updateProject.mutateAsync({ id: editingProject.id, ...data });
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ProjectStatus | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="idea">Ideas</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
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
            <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
            <p className="mb-4 text-muted-foreground">
              {statusFilter === 'all'
                ? 'Create your first project to get started.'
                : `No ${statusFilter} projects found.`}
            </p>
            {statusFilter === 'all' && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
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
