'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Github,
  FolderOpen,
  ExternalLink,
  Pencil,
  Trash2,
  Copy,
  Check,
  Link as LinkIcon,
  Save,
  FileText,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TodoInput } from '@/components/todos/todo-input';
import { TodoItem } from '@/components/todos/todo-item';
import { ProjectForm } from '@/components/projects/project-form';
import { useProject, useProjects } from '@/hooks/use-projects';
import { useTodos } from '@/hooks/use-todos';
import { cn } from '@/lib/utils';
import { ProjectStatus, TodoPriority } from '@/types';
import { detectPlatform, generateVSCodeUrl } from '@/lib/utils/platform';
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
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const platform = detectPlatform();

  // Load notes when project loads
  if (project && !notesLoaded) {
    setNotes(project.notes || '');
    setNotesLoaded(true);
  }

  const copyToClipboard = async (text: string, item: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(item);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleUpdateProject = async (data: any) => {
    if (project) {
      await updateProject.mutateAsync({ id: project.id, ...data });
    }
  };

  const handleSaveNotes = async () => {
    if (!project) return;
    setIsSavingNotes(true);
    try {
      await updateProject.mutateAsync({ id: project.id, notes });
      toast.success('Notes saved');
    } catch (error) {
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
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

      <div className="p-4 md:p-6 max-w-5xl mx-auto">
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

        {/* Tabs */}
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="todos">
              Todos {pendingTodos.length > 0 && `(${pendingTodos.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Paths Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Directory Paths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.mac_path && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">Mac</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-2 py-1.5 text-sm truncate font-mono">
                          {project.mac_path}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(project.mac_path!, 'mac')}
                        >
                          {copiedItem === 'mac' ? (
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
                      <p className="text-xs text-muted-foreground font-medium">PC</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-2 py-1.5 text-sm truncate font-mono">
                          {project.pc_path}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(project.pc_path!, 'pc')}
                        >
                          {copiedItem === 'pc' ? (
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

              {/* GitHub Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub Repository
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.github_ssh && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">SSH</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-2 py-1.5 text-sm truncate font-mono">
                          {project.github_ssh}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(project.github_ssh!, 'ssh')}
                        >
                          {copiedItem === 'ssh' ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  {project.github_https && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">HTTPS</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded bg-muted px-2 py-1.5 text-sm truncate font-mono">
                          {project.github_https}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => copyToClipboard(project.github_https!, 'https')}
                        >
                          {copiedItem === 'https' ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <a
                          href={project.github_https.replace('.git', '')}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  )}
                  {!project.github_ssh && !project.github_https && (
                    <p className="text-sm text-muted-foreground">No GitHub links configured</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Links */}
            {project.links && project.links.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Additional Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {project.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      >
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{link.label}</span>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Project Notes
                  </CardTitle>
                  <Button onClick={handleSaveNotes} disabled={isSavingNotes} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write your notes here... (supports markdown)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Use this space to keep notes, documentation, or any other information about this project.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Todos Tab */}
          <TabsContent value="todos">
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
          </TabsContent>
        </Tabs>
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
