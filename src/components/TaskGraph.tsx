import React, { useCallback, useRef, useEffect, useState} from "react";
import ForceGraph2D, { ForceGraphMethods, NodeObject } from "react-force-graph-2d";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";
import NodeActionsMenu from "./NodeActionsMenu";
//import * as d3 from "d3";

interface Node {
  id: string;
  name: string;
  val: number;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number; 
  fy?: number;
  selected?: boolean;
  description: string;
  status?: 'notStarted' | 'inProgress' | 'completed';
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface TaskGraphProps {
  data: GraphData;
  showDescriptions?: boolean;
  isChatOpen?: boolean;
  onNodeUpdate?: (nodeId: string, updates: Partial<Node>) => void;
}

const STATUS_COLORS = {
  notStarted: '#FFFFFF',  // White
  inProgress: '#FCD34D',  // Yellow
  completed: '#4ADE80',   // Green
} as const;

const TaskGraph = ({ data, showDescriptions = true, isChatOpen = false, onNodeUpdate }: TaskGraphProps) => {
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [actionMenuNode, setActionMenuNode] = useState<{x: number, y: number, node: Node} | null>(null);
  

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", updateDimensions);
    updateDimensions();

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const handleNodeClick = useCallback((node: NodeObject) => {
    const fg = fgRef.current;
    if (!fg) return;

    setActionMenuNode(null);
    setSelectedNodeId(node.id as string);
    setSelectedNode(node as Node);

    const transitionDuration = 800;
    const CHAT_WIDTH = 400;
    const offsetX = isChatOpen ? +(CHAT_WIDTH / 5) : 0;

    // Calculate the target center position
    const x = node.x || 0;
    const y = node.y || 0;

    // Center and zoom
    const moveCamera = () => {
      fg.centerAt(x + offsetX, y, transitionDuration);
      fg.zoom(1.2, transitionDuration);  // Less zoom in

      // Adjust forces when focusing on a node
      fg.d3Force('charge')?.strength(-1500);  // Strong repulsion
      fg.d3Force('link')
        ?.distance(250)    // Large distance
        ?.strength(0.4);   // Moderate link strength

      fg.d3ReheatSimulation();
    };

    setTimeout(moveCamera, 0);
  }, [isChatOpen]);

  // Add onNodeRightClick handler
  const handleNodeRightClick = useCallback((node: NodeObject, event: MouseEvent) => {
    event.preventDefault(); // Prevent default context menu
    const fg = fgRef.current;
    if (!fg) return;
    
    // Get screen coordinates after the node is centered
    const screenPos = fg.graph2ScreenCoords(node.x || 0, node.y || 0);
    if (screenPos) {
      setActionMenuNode({
        x: screenPos.x,
        y: screenPos.y,
        node: node as Node
      });
    }
  }, []);

  const handleBackgroundClick = useCallback(() => {
    const fg = fgRef.current;
    if (!fg || isEditing) return;
    
    // Clear selections
    setActionMenuNode(null);
    setSelectedNodeId(null);
    setSelectedNode(null);

    // Calculate center offset based on chat state
    const CHAT_WIDTH = 400;
    const offsetX = isChatOpen ? +(CHAT_WIDTH / 5) : 0;

    // Reset zoom and center with offset
    fg.centerAt(offsetX, 0, 1000);
    fg.zoom(1, 1000);  // Even more zoomed out

    // Release fixed positions
    data.nodes.forEach(node => {
      node.fx = undefined;
      node.fy = undefined;
    });

    // Set very strong repulsive forces and large link distances
    fg.d3Force('charge')?.strength(-2000);  // Much stronger repulsion
    fg.d3Force('link')
      ?.distance(300)     // Much larger distance
      ?.strength(0.3);    // Even weaker links for more spread

    // Weaker center force
    fg.d3Force('center')
      ?.strength(0.2);    // Very gentle centering force
    
    // Reheat the simulation with more energy
    fg.d3ReheatSimulation();
  }, [isChatOpen, isEditing, data.nodes]);

  const handleStartEditing = () => {
    if (selectedNode) {
      setEditedDescription(selectedNode.description);
      setIsEditing(true);
    }
  };


  const handleSaveDescription = () => {
    if (selectedNode && onNodeUpdate) {
      const fg = fgRef.current;
      if (fg) {
        // Store current force settings
        const currentChargeForce = fg.d3Force('charge');
        const currentLinkForce = fg.d3Force('link');

        // Completely remove forces temporarily
        fg.d3Force('charge', null);
        fg.d3Force('link', null);
      }

      // Do the update
      onNodeUpdate(selectedNode.id, { description: editedDescription });
      setSelectedNode({ ...selectedNode, description: editedDescription });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (selectedNode) {
      setEditedDescription(selectedNode.description);
    }
  };

  const cycleNodeStatus = useCallback((nodeId: string) => {
    if (!onNodeUpdate) return;
    const fg = fgRef.current;
    if (!fg) return;

    const node = data.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const statusCycle = {
      notStarted: 'inProgress',
      inProgress: 'completed',
      completed: 'notStarted'
    } as const;

    const currentStatus = node.status || 'notStarted';
    const nextStatus = statusCycle[currentStatus];

    // Pause the simulation
    fg.pauseAnimation();

    // Find all connected nodes through links
    const connectedNodeIds = new Set<string>();
    data.links.forEach(link => {
      if (link.source === nodeId) connectedNodeIds.add(link.target);
      if (link.target === nodeId) connectedNodeIds.add(link.source);
    });

    // Update the status and fix positions for the changed node and its connections
    onNodeUpdate(nodeId, { 
      status: nextStatus,
      fx: node.x,
      fy: node.y
    });

    // Fix positions for connected nodes
    connectedNodeIds.forEach(id => {
      const connectedNode = data.nodes.find(n => n.id === id);
      if (connectedNode && connectedNode.x !== undefined && connectedNode.y !== undefined) {
        onNodeUpdate(id, {
          fx: connectedNode.x,
          fy: connectedNode.y
        });
      }
    });

    // Resume with adjusted forces
    setTimeout(() => {
      fg.d3Force('link')?.distance(400).strength(1);  // Increased distance
      fg.d3Force('charge')?.strength(-300);           // Stronger repulsion
      fg.resumeAnimation();
    }, 100);

  }, [data.nodes, data.links, onNodeUpdate]);


  return (
    <div ref={containerRef} className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        onBackgroundClick={handleBackgroundClick}
        nodeLabel="name"
        nodeColor={(node) => {
          const typedNode = node as Node;
          return STATUS_COLORS[typedNode.status || 'notStarted'];
        }}
        linkColor={() => "#e2e8f0"}
        nodeRelSize={8} 
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
        cooldownTime={3000}
        onEngineStop={() => {
          // Fix nodes in place after simulation stops
          data.nodes.forEach(node => {
            node.fx = node.x;
            node.fy = node.y;
          });
        }}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeRightClick}
        onNodeDrag={(node) => {
          // Keep the node fixed during drag
          const typedNode = node as any;
          typedNode.fx = typedNode.x;
          typedNode.fy = typedNode.y;
        }}
        onNodeDragEnd={(node) => {
          // Release the fixed position after drag
          const typedNode = node as any;
          typedNode.fx = undefined;
          typedNode.fy = undefined;
          fgRef.current?.d3ReheatSimulation();
        }}
        //linkDistance={250}           // Larger default link distance
        //linkStrength={0.4}          // Weaker default link strength
        enableNodeDrag={true}
        cooldownTicks={0}
        warmupTicks={100}           // Added warmup ticks
        nodeCanvasObject={(node, ctx, globalScale) => {
          const typedNode = node as Node;
          const label = typedNode.name;
          const fontSize = 14/globalScale;
          ctx.font = `${fontSize}px Inter, Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

          // Draw node background with status color
          ctx.fillStyle = STATUS_COLORS[typedNode.status || 'notStarted'];
          ctx.fillRect(
            node.x! - bckgDimensions[0] / 2,
            node.y! - bckgDimensions[1] / 2,
            bckgDimensions[0],
            bckgDimensions[1]
          );

          // Draw highlight if node is selected
          if (typedNode.id === selectedNodeId) {
            ctx.strokeStyle = "#4f46e5";
            ctx.lineWidth = 3/globalScale;
            ctx.strokeRect(
              node.x! - bckgDimensions[0] / 2,
              node.y! - bckgDimensions[1] / 2,
              bckgDimensions[0],
              bckgDimensions[1]
            );
          }

          // Draw the text
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1a1a1a";
          ctx.fillText(label, node.x!, node.y!);
        }}
        nodeCanvasObjectMode={() => "replace"}
      />
      
      {/* Node Actions Menu */}
      {actionMenuNode && (
      <NodeActionsMenu
        x={actionMenuNode.x}
        y={actionMenuNode.y}
        onAddTask={() => console.log('Add task')}
        onDeleteTask={() => console.log('Delete task')}
        onEditTask={() => console.log('Edit task')}
        onChangeStatus={() => {
          cycleNodeStatus(actionMenuNode.node.id);
        }}
      />
    )}
      
      {/* Description Panel */}
      {selectedNode && showDescriptions && (
        <div className={`absolute bottom-0 left-0 p-6 bg-white/90 backdrop-blur border-t border-gray-200 transition-all duration-300 ${
          isChatOpen ? 'w-[calc(100%-400px)]' : 'w-full'
        }`}>
          <div className="max-w-4xl mx-auto">
            {isEditing ? (
              <div className="space-y-4">
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="min-h-[100px] text-base"
                  placeholder="Enter description..."
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveDescription}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="group/description relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 opacity-0 group-hover/description:opacity-100 transition-opacity"
                  onClick={handleStartEditing}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <div 
                  className="bg-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onDoubleClick={handleStartEditing}
                >
                  {selectedNode.description || "No description available"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskGraph;