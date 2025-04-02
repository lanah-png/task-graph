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

interface AIResponse {
  message_response: string;
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

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      // Simulated API call
      const helloWorld = httpsCallable(functions, 'hello_world');
      // Send the updated chat history along with the new user message
      const result = await helloWorld({ chatHistory: newMessages });
      
      // Make sure the response content is a string.
      const responseContent = result.data as AIResponse;
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
            description: "First component of the task that needs to be addressed. This subtask focuses on the initial phase."
          },
          { 
            id: "sub2", 
            name: "Subtask 2", 
            val: 10, 
            color: "#F97316",
            status: 'notStarted',
            description: "Second key component that builds upon the first subtask. This phase handles the core implementation."
          },
          { 
            id: "sub3", 
            name: "Subtask 3", 
            val: 10, 
            color: "#0EA5E9",
            status: 'notStarted',
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
        content: responseContent.message_response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing task:", error);
    }
  };
  const handleNodeUpdate = (nodeId: string, updates: Partial<Node>) => {
    setGraphData(prevData => {
      const updatedNodes = prevData.nodes.map(node => {
        if (node.id === nodeId) {
          // Determine the next status
          let nextStatus: 'notStarted' | 'inProgress' | 'completed';
          let nextColor: string;
          
          if (updates.status) {
            // If we're updating status, cycle through the states
            switch (node.status) {
              case 'notStarted':
                nextStatus = 'inProgress';
                nextColor = '#FCD34D'; // yellow
                break;
              case 'inProgress':
                nextStatus = 'completed';
                nextColor = '#4ADE80'; // green
                break;
              case 'completed':
                nextStatus = 'notStarted';
                nextColor = node.color || '#8B5CF6'; // original color
                break;
              default:
                nextStatus = 'inProgress';
                nextColor = '#FCD34D';
            }
            
            return {
              ...node,
              ...updates,
              status: nextStatus,
              color: nextColor,
            };
          }
          
          // For other updates, just merge them normally
          return { ...node, ...updates };
        }
        return node;
      });

      return {
        ...prevData,
        nodes: updatedNodes,
      };
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