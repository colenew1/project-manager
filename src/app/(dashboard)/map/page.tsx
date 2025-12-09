'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useMemo, useState, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Filter, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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
import { Project, ProjectStatus } from '@/types';

const nodeTypes: NodeTypes = {
  project: ProjectNode as any,
};

export default function MapPage() {
  const { projects, isLoading, updateProjectPosition } = useProjects();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  // Update nodes when projects change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

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

  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#888' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

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
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </Panel>

          {/* Info Panel */}
          <Panel position="top-right" className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border">
            <p className="text-sm text-muted-foreground">
              {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag nodes to reposition. Connect nodes by dragging handles.
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
