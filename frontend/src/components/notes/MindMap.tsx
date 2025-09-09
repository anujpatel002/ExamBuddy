'use client';
import ReactFlow, { Controls, Background, Node, Edge, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import dagre from 'dagre';
import Button from '../ui/Button';
import { FiRefreshCw, FiMaximize, FiMinimize } from 'react-icons/fi';

const nodeDefaults = {
  sourcePosition: Position.Bottom,
  targetPosition: Position.Top,
  style: {
    background: '#fff',
    border: '1px solid #4f46e5',
    color: '#333',
    borderRadius: '8px',
    padding: '10px 15px',
    fontSize: '12px',
    width: 180,
    textAlign: 'center',
  },
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - 90,
      y: nodeWithPosition.y - 25,
    };
  });

  return { nodes, edges };
};


const MindMap = ({ data }: { data: any }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [visibleNodeIds, setVisibleNodeIds] = useState(new Set<string>());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mindMapRef = useRef<HTMLDivElement>(null);

  const buildGraph = useCallback((newVisibleIds: Set<string>) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    function traverse(nodeData: any, parentId?: string) {
      if (!nodeData || !nodeData.name) return;
      const nodeId = parentId ? `${parentId}-${nodeData.name.replace(/\s+/g, '')}` : nodeData.name.replace(/\s+/g, '');

      if (newVisibleIds.has(nodeId)) {
        const hasChildren = nodeData.children && nodeData.children.length > 0;
        const childrenAreHidden = hasChildren && !newVisibleIds.has(`${nodeId}-${nodeData.children[0].name.replace(/\s+/g, '')}`);
        
        newNodes.push({
          id: nodeId,
          data: { label: `${nodeData.name} ${childrenAreHidden ? '(+)' : ''}` },
          position: { x: 0, y: 0 },
          ...nodeDefaults,
        });

        if (parentId && newVisibleIds.has(parentId)) {
            newEdges.push({ id: `${parentId}->${nodeId}`, source: parentId, target: nodeId, type: 'smoothstep' });
        }

        if (hasChildren) {
            nodeData.children.forEach((child: any) => traverse(child, nodeId));
        }
      }
    }
    
    traverse(data);
    const layouted = getLayoutedElements(newNodes, newEdges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setVisibleNodeIds(newVisibleIds);
  }, [data]);

  useEffect(() => {
    // --- THIS IS THE FIX ---
    // This ensures the graph is built with the root node when the component first loads.
    if (data?.name) {
      const rootId = data.name.replace(/\s+/g, '');
      setVisibleNodeIds(new Set([rootId]));
      buildGraph(new Set([rootId]));
    }
  }, [data, buildGraph]);
  
  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    const newVisibleIds = new Set(visibleNodeIds);

    function findNodeData(searchNode: any, targetId: string, parentId?: string): any {
        if (!searchNode || !searchNode.name) return null;
        const currentId = parentId ? `${parentId}-${searchNode.name.replace(/\s+/g, '')}` : searchNode.name.replace(/\s+/g, '');
        if (currentId === targetId) return searchNode;
        if (searchNode.children) {
            for(const child of searchNode.children) {
                const result = findNodeData(child, targetId, currentId);
                if (result) return result;
            }
        }
        return null;
    }

    const clickedNodeData = findNodeData(data, node.id);
    
    if (clickedNodeData?.children) {
        const firstChildId = `${node.id}-${clickedNodeData.children[0].name.replace(/\s+/g, '')}`;
        
        if (newVisibleIds.has(firstChildId)) {
            function hideChildren(children: any[], parentId: string) {
                children.forEach(child => {
                    const childId = `${parentId}-${child.name.replace(/\s+/g, '')}`;
                    newVisibleIds.delete(childId);
                    if (child.children) hideChildren(child.children, childId);
                });
            }
            hideChildren(clickedNodeData.children, node.id);
        } else {
            clickedNodeData.children.forEach((child: any) => {
                const childId = `${node.id}-${child.name.replace(/\s+/g, '')}`;
                newVisibleIds.add(childId);
            });
        }
    }
    
    buildGraph(newVisibleIds);
  };

  const resetView = () => {
    if (data?.name) {
      buildGraph(new Set([data.name.replace(/\s+/g, '')]));
    }
  };

  return (
    <div 
      ref={mindMapRef}
      className="rounded-lg overflow-hidden border dark:border-gray-700 relative"
      style={{ height: '600px' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Controls />
        <Background className="bg-white dark:bg-gray-800" />
      </ReactFlow>

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button onClick={resetView} size="sm">
          <FiRefreshCw className="mr-2" />
          Reset View
        </Button>
        <Button onClick={() => {
          if (!isFullscreen) {
            mindMapRef.current?.requestFullscreen();
            setIsFullscreen(true);
          } else {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
        }} size="sm">
          {isFullscreen ? <FiMinimize className="mr-2" /> : <FiMaximize className="mr-2" />}
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </Button>
      </div>
    </div>
  );
};

export default MindMap;