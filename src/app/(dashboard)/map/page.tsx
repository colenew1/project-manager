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
import { Filter, Trash2 } from 'lucide-react';
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
import { useProjects } from '@/hooks/use-projects';
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

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter((p) => p.status === statusFilter);
  }, [projects, statusFilter]);

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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
