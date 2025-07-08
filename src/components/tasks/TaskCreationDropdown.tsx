// src/components/tasks/TaskCreationDropdown.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, FilePlus2, Brain, ShieldAlert } from "lucide-react";
import { ValuationImpactResult } from "../../../supabase/functions/_shared/types";

interface TaskCreationDropdownProps {
  isGeneratingTasks: boolean;
  onCreateSingleTask: () => void;
  onGenerateDDTasks: () => void;
  valuationImpact: ValuationImpactResult | null;
  currentCompanyId: string;
}

const TaskCreationDropdown: React.FC<TaskCreationDropdownProps> = ({
  isGeneratingTasks,
  onCreateSingleTask,
  onGenerateDDTasks,
  valuationImpact,
  currentCompanyId,
}) => {
  const navigate = useNavigate();

  // Tarkista onko DD-riskianalyysi saatavilla
  const hasDDRiskAnalysis = valuationImpact?.dd_risk_analysis !== undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          {hasDDRiskAnalysis ? "Luo tehtäviä" : "Luo tehtäviä"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={onCreateSingleTask}
          className="cursor-pointer"
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          <span>Luo yksittäinen tehtävä</span>
        </DropdownMenuItem>

        {hasDDRiskAnalysis ? (
          // Jos DD-riskianalyysi on saatavilla, näytä DD-tehtävien luontivaihtoehto
          <DropdownMenuItem 
            onClick={onGenerateDDTasks}
            className="cursor-pointer"
            disabled={isGeneratingTasks}
          >
            <ShieldAlert className="mr-2 h-4 w-4" />
            <span>
              {isGeneratingTasks ? "Luodaan DD-tehtäviä..." : "Luo DD-tehtävät"}
            </span>
          </DropdownMenuItem>
        ) : (
          // Muussa tapauksessa näytä normaali tehtäväsarjan luontitoiminto
          <DropdownMenuItem 
            onClick={() => navigate('/task-generator')}
            className="cursor-pointer"
          >
            <Brain className="mr-2 h-4 w-4" />
            <span>Luo tehtäväsarja tekoälyllä</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TaskCreationDropdown;