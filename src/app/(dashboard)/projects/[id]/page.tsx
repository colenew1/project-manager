'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Github,
  FileText,
  FolderOpen,
  ExternalLink,
  Pencil,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TodoInput } from '@/components/todos/todo-input';
import { TodoItem } from '@/components/todos/todo-item';
import { ProjectForm } from '@/components/projects/project-form';
import { useProject, useProjects } from '@/hooks/use-projects';
import { useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';
import { ProjectStatus, TodoPriority } from '@/types';
import { detectPlatform, getRelevantPath, generateVSCodeUrl } from '@/lib/utils/platform';
import { toast } from 'sonner';

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: 'Idea', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  active: { label: 'Active', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  paused: { label: 'Paused', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  completed: { label: 'Completed', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  archived: { label: 'Archived', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { updateProject, deleteProject } = useProjects();
  const { todos, createTodo, toggleTodo, deleteTodo } = useTodos(projectId);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedPath, setCopiedPath] = useState<'mac' | 'pc' | null>(null);

  const platform = detectPlatform();

  const copyPath = async (path: string, type: 'mac' | 'pc') => {
    await navigator.clipboard.writeText(path);
    setCopiedPath(type);
    toast.success('Path copied to clipboard');
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleUpdateProject = async (data: any) => {
    if (project) {
      await updateProject.mutateAsync({ id: project.id, ...data });
    }
  };

  const handleDeleteProject = async () => {
    if (project && confirm(`Are you sure you want to delete "${project.name}"?`)) {
      await deleteProject.mutateAsync(project.id);
      router.push('/projects');
    }
  };

  const handleCreateTodo = async (data: {
    title: string;
    due_date?: string | null;
    priority: TodoPriority;
    project_ids: string[];
  }) => {
    await createTodo.mutateAsync({
      ...data,
      project_ids: [projectId, ...data.project_ids.filter((id) => id !== projectId)],
    });
  };

  if (projectLoading) {
    return (
      <>
        <Header />
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Link href="/projects">
            <Button variant="link">Back to Projects</Button>
          </Link>
        </div>
      </>
    );
  }

  const pendingTodos = todos.filter((t) => !t.is_completed);
  const completedTodos = todos.filter((t) => t.is_completed);

  return (
    <>
      <Header />

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {project.icon && <span>{project.icon}</span>}
              {project.name}
            </h1>
            <Badge
              variant="outline"
              className={cn('mt-2', statusConfig[project.status].className)}
            >
              {statusConfig[project.status].label}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-muted-foreground mb-6">{project.description}</p>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: `${tag.color}40`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Paths Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Directory Paths</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.mac_path && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mac</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-2 py-1 text-sm truncate">
                      {project.mac_path}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyPath(project.mac_path!, 'mac')}
                    >
                      {copiedPath === 'mac' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {platform === 'mac' && (
                      <a href={generateVSCodeUrl(project.mac_path)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}
              {project.pc_path && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">PC</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-2 py-1 text-sm truncate">
                      {project.pc_path}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyPath(project.pc_path!, 'pc')}
                    >
                      {copiedPath === 'pc' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {platform === 'windows' && (
                      <a href={generateVSCodeUrl(project.pc_path)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              )}
              {!project.mac_path && !project.pc_path && (
                <p className="text-sm text-muted-foreground">No paths configured</p>
              )}
            </CardContent>
          </Card>

          {/* Links Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub Repository
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {project.notes_url && (
                <a
                  href={project.notes_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Notes
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              )}
              {!project.github_url && !project.notes_url && (
                <p className="text-sm text-muted-foreground">No links configured</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Todos Section */}
        <div id="todos" className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Todos</h2>

          {/* Add Todo */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <TodoInput
                onSubmit={handleCreateTodo}
                defaultProjectId={projectId}
                placeholder="Add a todo for this project..."
              />
            </CardContent>
          </Card>

          {/* Pending Todos */}
          {pendingTodos.length > 0 && (
            <div className="space-y-1 mb-6">
              {pendingTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={(id, completed) => toggleTodo.mutate({ id, is_completed: completed })}
                  onDelete={(id) => deleteTodo.mutate(id)}
                  showProjects={false}
                />
              ))}
            </div>
          )}

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Completed ({completedTodos.length})
              </p>
              <div className="space-y-1">
                {completedTodos.slice(0, 5).map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={(id, completed) => toggleTodo.mutate({ id, is_completed: completed })}
                    onDelete={(id) => deleteTodo.mutate(id)}
                    showProjects={false}
                  />
                ))}
                {completedTodos.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    +{completedTodos.length - 5} more completed
                  </p>
                )}
              </div>
            </div>
          )}

          {pendingTodos.length === 0 && completedTodos.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No todos yet. Add one above!
            </p>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      <ProjectForm
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateProject}
        project={project}
        mode="edit"
      />
    </>
  );
}
