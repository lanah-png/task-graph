import React, { useState } from "react";
import TaskGraph from "@/components/TaskGraph";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatInterface from "@/components/ui/chat-interface";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, functions } from '@/firebase';
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
  status?: 'notStarted' | 'inProgress' | 'completed';
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

      // Add the function to call Firebase
  const callHelloWorld = async () => {
    try {
      const helloWorld = httpsCallable(functions, 'hello_world');
      const result = await helloWorld();
      console.log(result.data); // This will show the response in an alert
    } catch (error) {
      console.error('Error calling function:', error);
      alert('Error calling function. Check console for details.');
    }
  };


  const handleTaskSubmit = async (task: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: task,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      // Simulated API call

      //interface TaskNode {
      // id: string
      // title: string
      // description: string
      // status: 'new' | 'in-progress' | 'complete'
      // parentId?: string
      // childrenIds: string[]
      //}
      const mockResponse = {
        nodes: [ 
          { 
            id: "main", 
            name: task, 
            val: 20, 
            color: "#8B5CF6",
            status: 'notStarted',
            description: "This is the main task that needs to be broken down. Click on the subtasks to see their specific descriptions."
          },
          { 
            id: "sub1", 
            name: "Subtask 1", 
            val: 10, 
            color: "#D946EF",
            description: "One of the first components of the task that the user can address."
          },
          { 
            id: "sub2", 
            name: "Subtask 2", 
            val: 10, 
            color: "#F97316",
            status: 'notStarted',
            description: "Another example of one of the first components of the task that the user can address."
          },
          { 
            id: "sub3", 
            name: "Subtask 3", 
            val: 10, 
            color: "#0EA5E9",
            status: 'notStarted',
            description: "A third example of one of the first components of the task that the user can address."
          },
        ],
        links: [
          { source: "main", target: "sub1" },
          { source: "main", target: "sub2" },
          { source: "main", target: "sub3" },
        ],
      };
      callHelloWorld();
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
  const handleNodeUpdate = (nodeId: string, updates: any) => {
    // Check if this is a special action
    if (updates.__action === 'addSubtask') {
      // Extract the new task and link from the updates
      const { newTask, newLink } = updates;
      
      // Update the graph data to include the new node and link
      setGraphData(prevData => ({
        nodes: [...prevData.nodes, newTask],
        links: [...prevData.links, newLink]
      }));
    } else if (updates.__action === 'deleteNodes') {
      // Extract the node IDs to delete
      const { nodeIds } = updates;
      
      // Update the graph data to remove the nodes and their links
      setGraphData(prevData => ({
        nodes: prevData.nodes.filter(node => !nodeIds.includes(node.id)),
        links: prevData.links.filter(link => 
          !nodeIds.includes(typeof link.source === 'string' ? link.source : link.source.id) && 
          !nodeIds.includes(typeof link.target === 'string' ? link.target : link.target.id)
        )
      }));
    } else {
      // Handle regular node updates (status, name, description, etc.)
      setGraphData(prevData => ({
        ...prevData,
        nodes: prevData.nodes.map(node => 
          node.id === nodeId ? { ...node, ...updates } : node
        )
      }));
    }
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