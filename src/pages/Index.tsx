import React, { useState } from "react";
import TaskGraph from "@/components/TaskGraph";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatInterface from "@/components/ui/chat-interface";
import DescriptionToggle from "@/components/ui/descriptiontoggle";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

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

const Index = () => {
  const [graphData, setGraphData] = useState({
    nodes: [],
    links: [],
  });
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I can help you break down your tasks. What would you like to work on?',
      timestamp: new Date(),
    },
  ]);

  const handleTaskSubmit = async (task: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: task,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const mockResponse = {
        nodes: [
          { 
            id: "main", 
            name: task, 
            val: 20, 
            color: "#8B5CF6",
            description: "This is the main task that needs to be broken down. Click on the subtasks to see their specific descriptions."
          },
          { 
            id: "sub1", 
            name: "Subtask 1", 
            val: 10, 
            color: "#D946EF",
            description: "First component of the task that needs to be addressed. This subtask focuses on the initial phase."
          },
          { 
            id: "sub2", 
            name: "Subtask 2", 
            val: 10, 
            color: "#F97316",
            description: "Second key component that builds upon the first subtask. This phase handles the core implementation."
          },
          { 
            id: "sub3", 
            name: "Subtask 3", 
            val: 10, 
            color: "#0EA5E9",
            description: "Final phase of the task that brings everything together. This ensures all components are properly integrated."
          },
        ],
        links: [
          { source: "main", target: "sub1" },
          { source: "main", target: "sub2" },
          { source: "main", target: "sub3" },
        ],
      };

      setGraphData(mockResponse);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I've broken down "${task}" into several subtasks. You can see them in the graph. Click on any node to see its detailed description. Would you like to break down any of these subtasks further?`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing task:", error);
    }
  };
  const handleNodeUpdate = (nodeId: string, updates: Partial<Node>) => {
    console.log('Node Update Handler - Updates:', updates);
    setGraphData(prevData => {
      const newData = {
        nodes: prevData.nodes.map(node => 
          node.id === nodeId 
            ? { ...node, ...updates }
            : node
        ),
        links: prevData.links.map(link => ({...link})) // Deep copy links
      };
      console.log('Node Update Handler - New Graph Data:', newData);
      return newData;
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden dark relative">
      <div className="absolute inset-0">
        <TaskGraph 
          data={graphData} 
          showDescriptions={showDescriptions}
          isChatOpen={!isCollapsed}
          onNodeUpdate={handleNodeUpdate}
        />
        <DescriptionToggle 
          showDescriptions={showDescriptions}
          onToggle={setShowDescriptions}
        />
      </div>

      <div className={`absolute right-0 top-0 h-full transition-transform duration-300 ease-in-out ${
        isCollapsed ? 'translate-x-full' : 'translate-x-0'
      }`}>
        <div className="w-[400px] h-full bg-background/80 backdrop-blur-sm p-6">
          <ChatInterface 
            messages={messages}
            onTaskSubmit={handleTaskSubmit}
          />
        </div>
      </div>

      <Button
        variant="ghost"
        className="absolute right-4 top-2 z-50"
        onClick={() => setIsCollapsed(!isCollapsed)}
        size="sm"
      >
        {isCollapsed ? <ChevronLeft /> : <ChevronRight />}
      </Button>
    </div>
  );
};

export default Index;