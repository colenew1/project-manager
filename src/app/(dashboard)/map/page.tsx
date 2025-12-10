'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
  NodeTypes,
  EdgeChange,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Filter, Trash2, Plus, Check, ExternalLink, Github, Globe, FolderOpen, StickyNote } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { ProjectNode } from '@/components/map/project-node';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { useProjects } from '@/hooks/use-projects';
import { detectPlatform, getRelevantPath, generateCursorUrl } from '@/lib/utils/platform';
import { cn } from '@/lib/utils';
import { useProjectRelations } from '@/hooks/use-project-relations';
import { Project, ProjectStatus } from '@/types';
import { toast } from 'sonner';

const nodeTypes: NodeTypes = {
  project: ProjectNode as any,
};

function MapPageContent() {
  const { projects, isLoading, updateProjectPosition } = useProjects();
  const { relations, createRelation, deleteRelation, deleteRelationByNodes } = useProjectRelations();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [hiddenProjectIds, setHiddenProjectIds] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [platform] = useState(() => detectPlatform());
  const { getViewport } = useReactFlow();

  // Filter projects (by status and hidden state)
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((p) => !hiddenProjectIds.has(p.id));
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    return filtered;
  }, [projects, statusFilter, hiddenProjectIds]);

  // Get hidden projects for the "Add to Map" dropdown
  const hiddenProjects = useMemo(() => {
    return projects.filter((p) => hiddenProjectIds.has(p.id));
  }, [projects, hiddenProjectIds]);

  // Add a project back to the map
  const addProjectToMap = useCallback((projectId: string) => {
    setHiddenProjectIds((prev) => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });

    // Set a position for the newly added project (center of current view)
    const viewport = getViewport();
    const centerX = (-viewport.x + 400) / viewport.zoom;
    const centerY = (-viewport.y + 300) / viewport.zoom;

    updateProjectPosition.mutate({
      id: projectId,
      position_x: centerX,
      position_y: centerY,
    });

    toast.success('Project added to map');
  }, [getViewport, updateProjectPosition]);

  // Convert projects to nodes
  const initialNodes: Node[] = useMemo(() => {
    return filteredProjects.map((project, index) => ({
      id: project.id,
      type: 'project',
      position: {
        x: project.position_x || (index % 4) * 300 + 50,
        y: project.position_y || Math.floor(index / 4) * 250 + 50,
      },
      data: { project },
    }));
  }, [filteredProjects]);

  // Convert relations to edges - include handle positions
  const initialEdges: Edge[] = useMemo(() => {
    return relations.map((relation) => ({
      id: relation.id,
      source: relation.source_id,
      target: relation.target_id,
      sourceHandle: relation.source_handle || undefined,
      targetHandle: relation.target_handle || undefined,
      animated: true,
      style: { stroke: '#888', strokeWidth: 2 },
      label: relation.label || undefined,
    }));
  }, [relations]);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node changes - intercept deletions to hide instead of delete
  const onNodesChange = useCallback(
    (changes: any[]) => {
      const nonDeleteChanges = changes.filter((change) => {
        if (change.type === 'remove') {
          // Instead of removing, add to hidden list
          setHiddenProjectIds((prev) => new Set([...prev, change.id]));
          toast.info('Project hidden from map. Use "Add Project" to restore.');
          return false;
        }
        return true;
      });
      onNodesChangeBase(nonDeleteChanges);
    },
    [onNodesChangeBase]
  );

  // Track previous project IDs to avoid unnecessary updates
  const prevProjectIdsRef = useRef<string>('');
  const prevRelationIdsRef = useRef<string>('');

  // Update nodes when filtered projects change (by ID)
  useEffect(() => {
    const projectIds = filteredProjects.map(p => p.id).sort().join(',');
    if (projectIds === prevProjectIdsRef.current) return;
    prevProjectIdsRef.current = projectIds;

    const newNodes: Node[] = filteredProjects.map((project, index) => ({
      id: project.id,
      type: 'project',
      position: {
        x: project.position_x || (index % 4) * 300 + 50,
        y: project.position_y || Math.floor(index / 4) * 250 + 50,
      },
      data: { project },
    }));
    setNodes(newNodes);
  }, [filteredProjects, setNodes]);

  // Update edges when relations change (by ID)
  useEffect(() => {
    const relationIds = relations.map(r => r.id).sort().join(',');
    if (relationIds === prevRelationIdsRef.current) return;
    prevRelationIdsRef.current = relationIds;

    const newEdges: Edge[] = relations.map((relation) => ({
      id: relation.id,
      source: relation.source_id,
      target: relation.target_id,
      sourceHandle: relation.source_handle || undefined,
      targetHandle: relation.target_handle || undefined,
      animated: true,
      style: { stroke: '#888', strokeWidth: 2 },
      label: relation.label || undefined,
    }));
    setEdges(newEdges);
  }, [relations, setEdges]);

  // Handle node drag end - save position
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateProjectPosition.mutate({
        id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
      });
    },
    [updateProjectPosition]
  );

  // Handle edge connections - save to database with handle positions
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        // Save to database with handle positions
        createRelation.mutate({
          source_id: params.source,
          target_id: params.target,
          relation_type: 'related_to',
          source_handle: params.sourceHandle || null,
          target_handle: params.targetHandle || null,
        });
      }
    },
    [createRelation]
  );

  // Handle edge deletion
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Check for removals
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const edge = edges.find((e) => e.id === change.id);
          if (edge) {
            deleteRelationByNodes.mutate({
              source_id: edge.source,
              target_id: edge.target,
            });
          }
        }
      });
      onEdgesChange(changes);
    },
    [edges, onEdgesChange, deleteRelationByNodes]
  );

  // Handle edge click - select it
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
    },
    []
  );

  // Handle pane click - deselect edge
  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
  }, []);

  // Handle node double-click - open project popup
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const project = node.data?.project as Project | undefined;
      if (project) {
        setSelectedProject(project);
      }
    },
    []
  );

  // Delete selected edge
  const handleDeleteEdge = useCallback(() => {
    if (selectedEdge) {
      deleteRelation.mutate(selectedEdge.id);
      setSelectedEdge(null);
      toast.success('Connection deleted');
    }
  }, [selectedEdge, deleteRelation]);

  // Style edges - highlight selected
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        stroke: selectedEdge?.id === edge.id ? '#ef4444' : '#888',
        strokeWidth: selectedEdge?.id === edge.id ? 3 : 2,
      },
    }));
  }, [edges, selectedEdge]);

  // MiniMap node color
  const nodeColor = useCallback((node: Node) => {
    const project = node.data?.project as Project | undefined;
    return project?.color || '#6366f1';
  }, []);

  if (isLoading) {
    return (
      <>
        <Header title="Project Map" />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Project Map" />

      <div className="h-[calc(100vh-64px)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={['Backspace', 'Delete']}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#888', strokeWidth: 2 },
          }}
        >
          {/* Controls Panel */}
          <Panel position="top-left" className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}
            >
              <SelectTrigger className="w-[140px] bg-background">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="idea">Ideas</SelectItem>
                <SelectItem value="under_construction">Under Construction</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Project button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-background">
                  <Plus className="h-4 w-4" />
                  Add Project
                  {hiddenProjects.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                      {hiddenProjects.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {hiddenProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2 text-center">
                      All projects are on the map
                    </p>
                  ) : (
                    hiddenProjects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => addProjectToMap(project.id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                      >
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate">
                          {project.icon && <span className="mr-1">{project.icon}</span>}
                          {project.name}
                        </span>
                        <Plus className="h-3 w-3 ml-auto text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Delete edge button */}
            {selectedEdge && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteEdge}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Connection
              </Button>
            )}
          </Panel>

          {/* Info Panel */}
          <Panel position="top-right" className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
            <p className="text-sm text-muted-foreground">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag handles to connect. Click edge to select, then delete.
            </p>
          </Panel>

          {/* Controls */}
          <Controls
            showInteractive={false}
            className="bg-background border rounded-lg"
          />

          {/* Background */}
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--muted-foreground) / 0.2)"
          />

          {/* MiniMap */}
          <MiniMap
            nodeColor={nodeColor}
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-background border rounded-lg"
          />
        </ReactFlow>
      </div>

      {/* Project Quick View Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedProject.icon && <span>{selectedProject.icon}</span>}
                  {selectedProject.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      selectedProject.status === 'idea' && 'bg-purple-500/10 text-purple-500 border-purple-500/20',
                      selectedProject.status === 'under_construction' && 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                      selectedProject.status === 'active' && 'bg-green-500/10 text-green-500 border-green-500/20',
                      selectedProject.status === 'paused' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                      selectedProject.status === 'completed' && 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                      selectedProject.status === 'archived' && 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    )}
                  >
                    {selectedProject.status.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Description */}
                {selectedProject.description && (
                  <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                )}

                {/* Quick Links */}
                <div className="flex flex-wrap gap-2">
                  {selectedProject.live_url && (
                    <a
                      href={selectedProject.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Live Site
                    </a>
                  )}
                  {selectedProject.github_url && (
                    <a
                      href={selectedProject.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  {(() => {
                    const path = getRelevantPath(selectedProject.mac_path, selectedProject.pc_path, platform);
                    return path ? (
                      <a
                        href={generateCursorUrl(path)}
                        className="inline-flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <FolderOpen className="h-4 w-4" />
                        Open in Cursor
                      </a>
                    ) : null;
                  })()}
                </div>

                {/* Tags */}
                {selectedProject.tags && selectedProject.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedProject.tags.map((tag) => (
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
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Link href={`/projects/${selectedProject.id}`} className="flex-1">
                    <Button className="w-full" onClick={() => setSelectedProject(null)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Full Details
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Wrap with ReactFlowProvider for useReactFlow hook
export default function MapPage() {
  return (
    <ReactFlowProvider>
      <MapPageContent />
    </ReactFlowProvider>
  );
}
