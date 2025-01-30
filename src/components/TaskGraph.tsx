import React, { useCallback, useRef, useEffect, useState} from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";

interface Node {
  id: string;
  name: string;
  val: number;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
  selected?: boolean;
  description: string;
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
}

const TaskGraph = ({ data }: TaskGraphProps) => {
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

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

    setSelectedNodeId(node.id);
    setSelectedNode(node);

    // Get the current zoom level
    const distance = 40;
    const transitionDuration = 800;

    // Calculate the position to center on
    const x = node.x || 0;
    const y = node.y || 0;

    // Center and zoom
    const moveCamera = () => {
      // Center on the node
      fg.centerAt(x, y, transitionDuration);
      
      // Zoom in
      setTimeout(() => {
        fg.zoom(2, transitionDuration);
      }, 50);
    };

    setTimeout(moveCamera, 0);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    setSelectedNodeId(null);
    setSelectedNode(null);

    // Reset zoom and center
    fg.centerAt(0, 0, 1000);
    fg.zoom(3, 1000);

    // Reset forces to default values
    fg.d3Force('charge')?.strength(-30);
    fg.d3Force('link')?.distance(30);
    
    // Reheat the simulation
    fg.d3ReheatSimulation();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        onBackgroundClick={handleBackgroundClick}
        nodeLabel="name"
        nodeColor={(node: Node) => node.color || "#6366f1"}
        linkColor={() => "#e2e8f0"}
        nodeRelSize={8}
        linkWidth={2}
        onNodeClick={handleNodeClick}
        nodeCanvasObject={(node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.name;
          const fontSize = 14/globalScale;
          ctx.font = `${fontSize}px Inter, Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.8);

          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
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

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1a1a1a";
          ctx.fillText(label, node.x!, node.y!);
        }}
        nodeCanvasObjectMode={() => "replace"}
        cooldownTicks={100}
      />
      
      {/* Description Panel */}
      {selectedNode && (
        <div className="absolute bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-100 rounded-lg p-4">
              {selectedNode.description || "No description available"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskGraph;