import React, { useCallback, useRef, useEffect, useState} from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";
import NodeActionsMenu from "./nodeactionsmenu";

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

  const handleNodeClick = useCallback((node: Node) => {
    const fg = fgRef.current;
    if (!fg) return;

    // Clear the action menu when clicking a different node
    setActionMenuNode(null);

    setSelectedNodeId(node.id);
    setSelectedNode(node);

    const transitionDuration = 800;
    const CHAT_WIDTH = 400;

    // Calculate the target center position
    const x = node.x || 0;
    const y = node.y || 0;
    const offsetX = isChatOpen ? +(CHAT_WIDTH / 5) : 0;

    // Center and zoom
    const moveCamera = () => {
      fg.centerAt(x + offsetX, y, transitionDuration);
      fg.zoom(2, transitionDuration);
    };

    setTimeout(moveCamera, 0);
}, [isChatOpen]);

// Add onNodeRightClick handler
const handleNodeRightClick = useCallback((node: Node, event: MouseEvent) => {
  event.preventDefault(); // Prevent default context menu
  const fg = fgRef.current;
  if (!fg) return;
  
  // Get screen coordinates after the node is centered
  const screenPos = fg.graph2ScreenCoords(node.x || 0, node.y || 0);
  if (screenPos) {
    setActionMenuNode({
      x: screenPos.x,
      y: screenPos.y,
      node: node
    });
  }
}, []);

const handleBackgroundClick = useCallback(() => {
  const fg = fgRef.current;
  if (!fg || isEditing) return;
  
  // Clear both the selection and action menu
  setActionMenuNode(null);
  setSelectedNodeId(null);
  setSelectedNode(null);

  // Calculate center offset based on chat state
  const CHAT_WIDTH = 400;
  const offsetX = isChatOpen ? +(CHAT_WIDTH / 5) : 0;

  // Reset zoom and center with offset
  fg.centerAt(offsetX, 0, 1000);
  fg.zoom(3, 1000);

  // Reset forces to default values
  fg.d3Force('charge')?.strength(-30);
  fg.d3Force('link')?.distance(30);
  
  // Reheat the simulation
  fg.d3ReheatSimulation();
}, [isChatOpen, isEditing]);

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

  // Update the status
  onNodeUpdate(nodeId, { status: nextStatus });
}, [data.nodes, onNodeUpdate]);


  return (
    <div ref={containerRef} className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        onBackgroundClick={handleBackgroundClick}
        nodeLabel="name"
        nodeColor={(node: Node) => {
          console.log('Node color calculation:', {
            id: node.id,
            status: node.status,
            color: STATUS_COLORS[node.status || 'notStarted']
          });
          return STATUS_COLORS[node.status || 'notStarted'];
        }}
        linkColor={() => "#e2e8f0"}
        nodeRelSize={8} 
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
        cooldownTime={1000}
        onEngineStop={() => {
          // Fix nodes in place after simulation stops
          data.nodes.forEach(node => {
            node.fx = node.x;
            node.fy = node.y;
          });
        }}
        onNodeClick={handleNodeClick}
        onNodeRightClick={handleNodeRightClick}
        nodeCanvasObject={(node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 14/globalScale;
          ctx.font = `${fontSize}px Inter, Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

          // Draw node background with status color
          ctx.fillStyle = STATUS_COLORS[node.status || 'notStarted'];
          ctx.fillRect(
            node.x! - bckgDimensions[0] / 2,
            node.y! - bckgDimensions[1] / 2,
            bckgDimensions[0],
            bckgDimensions[1]
          );

          // Draw highlight if node is selected
          if (node.id === selectedNodeId) {
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
          console.log('Change status clicked for node:', actionMenuNode.node.id);
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