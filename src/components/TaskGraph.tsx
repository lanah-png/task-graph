import React, { useCallback, useRef, useEffect } from "react";
import { ForceGraph2D } from "react-force-graph";

// Define the ForceGraphMethods type since it's not exported directly
interface ForceGraphMethods {
  centerAt: (x: number, y: number, duration?: number) => void;
  zoom: (zoom: number, duration?: number) => void;
}

interface Node {
  id: string;
  name: string;
  val: number;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
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
  // Update the ref type to include ForceGraphMethods
  const fgRef = useRef<ForceGraphMethods>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: window.innerWidth, height: window.innerHeight });

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
        fg.zoom(1.5, transitionDuration);
      }, 50); // Small delay to ensure smooth transition
    };

    // Add a small delay to ensure node positions are calculated
    setTimeout(moveCamera, 0);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
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

          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1a1a1a";
          ctx.fillText(label, node.x!, node.y!);
        }}
        nodeCanvasObjectMode={() => "replace"}
        cooldownTicks={100}
      />
    </div>
  );
};

export default TaskGraph;