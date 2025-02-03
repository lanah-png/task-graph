import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DescriptionToggleProps {
  showDescriptions: boolean;
  onToggle: (value: boolean) => void;
}

const DescriptionToggle = ({ showDescriptions, onToggle }: DescriptionToggleProps) => {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm">
      <Switch 
        id="description-mode"
        checked={showDescriptions}
        onCheckedChange={onToggle}
      />
      <Label 
        htmlFor="description-mode" 
        className="text-sm font-medium cursor-pointer"
      >
        Show Descriptions
      </Label>
    </div>
  );
};

export default DescriptionToggle;