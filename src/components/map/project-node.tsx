'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Github, StickyNote, CheckSquare, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Project, ProjectStatus } from '@/types';

interface ProjectNodeData extends Record<string, unknown> {
  project: Project;
}

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  idea: { label: 'Idea', className: 'bg-purple-500 text-white' },
  active: { label: 'Active', className: 'bg-green-500 text-white' },
  paused: { label: 'Paused', className: 'bg-yellow-500 text-white' },
  completed: { label: 'Completed', className: 'bg-blue-500 text-white' },
  archived: { label: 'Archived', className: 'bg-gray-500 text-white' },
};

function ProjectNodeComponent({ data, selected }: { data: ProjectNodeData; selected?: boolean }) {
  const { project } = data;
  const todoCount = project.todos?.filter((t) => !t.is_completed).length || 0;

  return (
    <>
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-muted-foreground !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-muted-foreground !w-3 !h-3"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-muted-foreground !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-muted-foreground !w-3 !h-3"
      />

      {/* Node content */}
      <div
        className={cn(
          'min-w-[200px] max-w-[280px] rounded-lg border-2 bg-card p-3 shadow-lg transition-all',
          selected ? 'border-primary shadow-xl' : 'border-border'
        )}
        style={{ borderTopColor: project.color, borderTopWidth: '4px' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">
              {project.icon && <span className="mr-1">{project.icon}</span>}
              {project.name}
            </h3>
          </div>
          <Badge className={cn('text-xs flex-shrink-0', statusConfig[project.status].className)}>
            {statusConfig[project.status].label}
          </Badge>
        </div>

        {/* Description */}
        {project.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-1.5 py-0"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {tag.name}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-foreground transition-colors text-green-600"
            >
              <Globe className="h-3.5 w-3.5" />
            </a>
          )}
          {project.github_url && (
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-foreground transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          )}
          {project.notes && (
            <div className="hover:text-foreground transition-colors">
              <StickyNote className="h-3.5 w-3.5" />
            </div>
          )}
          {todoCount > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>{todoCount}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export const ProjectNode = memo(ProjectNodeComponent);
