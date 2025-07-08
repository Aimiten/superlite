// src/components/chat/TaskPanelButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskContext } from "./types";

interface TaskPanelButtonProps {
  taskContext: TaskContext;
  onClick: () => void;
  isOpen: boolean;
}

const TaskPanelButton: React.FC<TaskPanelButtonProps> = ({
  taskContext,
  onClick,
  isOpen
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isOpen ? "secondary" : "outline"}
            size="sm"
            onClick={onClick}
            className="gap-1.5"
          >
            <PanelRight className="h-3.5 w-3.5" />
            <span>{isOpen ? "Sulje tehtäväeditori" : "Avaa tehtäväeditori"}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Avaa tehtäväeditori työstääksesi tehtävää "{taskContext.taskTitle}"</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TaskPanelButton;