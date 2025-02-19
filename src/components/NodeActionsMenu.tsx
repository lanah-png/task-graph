import React from 'react';
import { Plus, Trash2, Edit, RotateCw } from 'lucide-react';

interface NodeActionsMenuProps {
  x: number;
  y: number;
  onAddTask: () => void;
  onDeleteTask: () => void;
  onEditTask: () => void;
  onChangeStatus: () => void;
}

const NodeActionsMenu = ({ 
  x, 
  y, 
  onAddTask, 
  onDeleteTask, 
  onEditTask, 
  onChangeStatus 
}: NodeActionsMenuProps) => {
  // Increase radius to create more space around the node
  const radius = 65;
  
  // Add a slight offset for better visual alignment
  const buttonOffset = 15;
  
  // Define menu items with their positions
  const menuItems = [
    { 
      icon: Plus,
      label: 'Add Task',
      onClick: onAddTask,
      position: { x: x + radius, y } // Right
    },
    { 
      icon: Edit,
      label: 'Edit Task',
      onClick: onEditTask,
      position: { x, y: y - radius } // Top
    },
    { 
      icon: Trash2,
      label: 'Delete Task',
      onClick: onDeleteTask,
      position: { x: x - radius, y } // Left
    },
    { 
      icon: RotateCw,
      label: 'Change Status',
      onClick: onChangeStatus,
      position: { x, y: y + radius } // Bottom
    }
];

  

  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="relative w-full h-full">
        {/* Semi-transparent circle background */}
        <div 
          className="absolute rounded-full bg-black/5"
          style={{
            width: radius * 2 + buttonOffset,
            height: radius * 2 + buttonOffset,
            left: x - radius - buttonOffset/2,
            top: y - radius - buttonOffset/2
          }}
        />
        
        {/* Menu items */}
        {menuItems.map(({ icon: Icon, label, onClick, position }, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg pointer-events-auto hover:bg-gray-100 transition-all duration-200 group"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Icon className="w-5 h-5 text-gray-600" />
            <span className="absolute whitespace-nowrap bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity -translate-y-full -translate-x-1/2 left-1/2 top-0 mt-[-8px]">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NodeActionsMenu;