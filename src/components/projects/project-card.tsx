'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Github,
  FolderOpen,
  MoreHorizontal,
  CheckSquare,
  Pencil,
  Trash2,
  Copy,
  Link as LinkIcon,
  StickyNote,
  Globe,
  Terminal,
  Check,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Project, ProjectStatus, ProjectCategory, Tag } from '@/types';
import { detectPlatform, getRelevantPath, generateCursorUrl, formatPathForDisplay } from '@/lib/utils/platform';

const categoryLabels: Record<ProjectCategory, string> = {
  personal: 'Personal',
  marketing: 'Marketing',
  sales: 'Sales',
  customer_success: 'Customer Success',
  engineering: 'Engineering',
  product: 'Product',
  design: 'Design',
  operations: 'Operations',
  finance: 'Finance',
  hr: 'HR',
  other: 'Other',
};

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onToggleFavorite?: (project: Project) => void;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: 'Idea', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  under_construction: { label: 'Under Construction', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  active: { label: 'Active', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  paused: { label: 'Paused', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  completed: { label: 'Completed', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  archived: { label: 'Archived', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

export function ProjectCard({ project, onEdit, onDelete, onToggleFavorite }: ProjectCardProps) {
  const [platform] = useState(() => detectPlatform());
  const [copied, setCopied] = useState(false);
  const relevantPath = getRelevantPath(project.mac_path, project.pc_path, platform);
  const todoCount = project.todos?.filter((t) => !t.is_completed).length || 0;

  const copyPath = () => {
    if (relevantPath) {
      navigator.clipboard.writeText(relevantPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <TooltipProvider>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
        {/* Color accent bar */}
        <div
          className="absolute left-0 top-0 h-1 w-full"
          style={{ backgroundColor: project.color }}
        />

        <CardHeader className="pb-2">
          {/* Favorite star button - top right */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onToggleFavorite?.(project)}
                className="absolute top-3 right-3 p-1 rounded hover:bg-muted transition-colors z-10"
              >
                <Star
                  className={cn(
                    "h-4 w-4 transition-colors",
                    project.is_favorite
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/50 hover:text-yellow-400"
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {project.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            </TooltipContent>
          </Tooltip>

          <div className="flex items-start justify-between pr-6">
            <div className="flex-1 min-w-0">
              <Link
                href={`/projects/${project.id}`}
                className="block truncate text-lg font-semibold hover:underline"
              >
                {project.icon && <span className="mr-2">{project.icon}</span>}
                {project.name}
              </Link>
              <Badge
                variant="outline"
                className={cn('mt-1', statusConfig[project.status].className)}
              >
                {statusConfig[project.status].label}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onToggleFavorite?.(project)}>
                  <Star className={cn("mr-2 h-4 w-4", project.is_favorite && "fill-yellow-400 text-yellow-400")} />
                  {project.is_favorite ? 'Unfavorite' : 'Favorite'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(project)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyPath} disabled={!relevantPath}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Path
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(project)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 flex-1 flex flex-col">
          {/* Description */}
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Categories */}
          {project.categories && project.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.categories.map((category) => (
                <Badge
                  key={category}
                  variant="outline"
                  className="text-xs"
                >
                  {categoryLabels[category]}
                </Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: `${tag.color}40`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {project.tags.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.tags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Path */}
          {relevantPath && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate flex-1">{formatPathForDisplay(relevantPath, 30)}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={copyPath}
                    className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Terminal className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {copied ? 'Copied!' : 'Copy path for terminal'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={generateCursorUrl(relevantPath)}
                    className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Open in Cursor</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Quick Links */}
          <div className="flex items-center gap-2 pt-2 border-t border-border mt-auto">
            {/* Live URL - prominent link to deployed site */}
            {project.live_url && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted transition-colors text-green-600"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>View Live Site</TooltipContent>
              </Tooltip>
            )}

            {/* GitHub link */}
            {project.github_url && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <Github className="h-4 w-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>GitHub Repository</TooltipContent>
              </Tooltip>
            )}

            {/* Notes indicator - links to project detail page notes tab */}
            {project.notes && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/projects/${project.id}?tab=notes`}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <StickyNote className="h-4 w-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>View Notes</TooltipContent>
              </Tooltip>
            )}

            {/* Additional links count */}
            {project.links && project.links.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-1 p-1.5 rounded-md hover:bg-muted transition-colors text-xs"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>{project.links.length}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{project.links.length} additional link(s)</TooltipContent>
              </Tooltip>
            )}

            {todoCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/projects/${project.id}#todos`}
                    className="flex items-center gap-1 p-1.5 rounded-md hover:bg-muted transition-colors text-xs"
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>{todoCount}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{todoCount} open todo(s)</TooltipContent>
              </Tooltip>
            )}

            <div className="flex-1" />

            <Link href={`/projects/${project.id}`}>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                View
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
