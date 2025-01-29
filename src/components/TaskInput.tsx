import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface TaskInputProps {
  onTaskSubmit: (task: string) => void;
}

const TaskInput = ({ onTaskSubmit }: TaskInputProps) => {
  const [task, setTask] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim()) {
      toast({
        title: "Please enter a task",
        description: "The task description cannot be empty",
        variant: "destructive",
      });
      return;
    }
    onTaskSubmit(task);
    setTask("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Task Breakdown</h2>
        <p className="text-sm text-gray-500">
          Enter your task and we'll break it down into manageable steps
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter your task here..."
          className="w-full"
        />
        <Button type="submit" className="w-full">
          Break Down Task
        </Button>
      </form>
    </div>
  );
};

export default TaskInput;