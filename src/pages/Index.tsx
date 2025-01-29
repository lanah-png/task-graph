import React, { useState } from "react";
import TaskGraph from "@/components/TaskGraph";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ChatInterface from "@/components/ui/chat-interface";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Index = () => {
  const [graphData, setGraphData] = useState({
    nodes: [],
    links: [],
  });
  
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I can help you break down your tasks. What would you like to work on?',
      timestamp: new Date(),
    },
  ]);

  const handleTaskSubmit = async (task: string) => {
    // Add user message
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
          { id: "main", name: task, val: 20, color: "#8B5CF6" },
          { id: "sub1", name: "Subtask 1", val: 10, color: "#D946EF" },
          { id: "sub2", name: "Subtask 2", val: 10, color: "#F97316" },
          { id: "sub3", name: "Subtask 3", val: 10, color: "#0EA5E9" },
        ],
        links: [
          { source: "main", target: "sub1" },
          { source: "main", target: "sub2" },
          { source: "main", target: "sub3" },
        ],
      };

      setGraphData(mockResponse);

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I've broken down "${task}" into several subtasks. You can see them in the graph. Would you like to break down any of these subtasks further?`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing task:", error);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden dark relative">
      <div className="absolute inset-0">
        <TaskGraph data={graphData} />
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