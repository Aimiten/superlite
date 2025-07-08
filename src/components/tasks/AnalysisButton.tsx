// src/components/tasks/AnalysisButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, TrendingUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AnalysisButtonProps {
  isEnabled: boolean;
  completionPercentage: number;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasAnalysis: boolean;
  hasDDTasks?: boolean;
  ddTasksCompletionRate?: number; // 0-1
  previousAnalysisId?: string;
  onAnalyzePostDD?: (previousAnalysisId: string) => void;
}

export const AnalysisButton: React.FC<AnalysisButtonProps> = ({
  isEnabled,
  completionPercentage,
  onAnalyze,
  isAnalyzing,
  hasAnalysis,
  hasDDTasks = false,
  ddTasksCompletionRate = 0,
  previousAnalysisId,
  onAnalyzePostDD
}) => {
  const threshold = 75;
  const ddThreshold = 75;

  // Jos analyysi on jo tehty, mutta on DD-tehtäviä, näytetään DD-nappi
  const showPostDDButton = hasAnalysis && hasDDTasks && 
    ddTasksCompletionRate >= (ddThreshold / 100) && 
    previousAnalysisId;

  // Jos DD-tehtävien jälkeinen analyysi on käytössä
  if (showPostDDButton && onAnalyzePostDD) {
    const handlePostDDAnalyze = () => {
      if (previousAnalysisId) {
        onAnalyzePostDD(previousAnalysisId);
      }
    };

    const buttonContent = isAnalyzing ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Päivitetään analyysiä...
      </>
    ) : (
      <>
        <TrendingUp className="h-4 w-4 mr-2" />
        Päivitä analyysi DD-toimenpiteiden jälkeen
      </>
    );

    const helpText = `Päivitä arvovaikutusanalyysi DD-toimenpiteiden jälkeen`;

    return (
      <div className="flex flex-col items-start gap-2">
         <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                   <Button
                     onClick={handlePostDDAnalyze}
                     disabled={isAnalyzing}
                     className="gap-2"
                   >
                     {buttonContent}
                   </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{helpText}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
    );
  }

  // Muuten näytetään normaali analyysinappi (tai ei mitään jos analyysi on tehty)
  if (hasAnalysis) {
    return null;
  }

  // Alkuperäinen analyysinappi
  const buttonContent = isAnalyzing ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
      <span className="text-white">Analysoidaan...</span>
    </>
  ) : (
    <>
      <TrendingUp className="h-4 w-4 mr-2 text-white" />
      <span className="text-white">Analysoi arvovaikutus</span>
    </>
  );

  const helpText = isEnabled
    ? "Käynnistä analyysi nähdäksesi tehtävien vaikutus yrityksesi arvoon."
    : `Suorita vähintään ${threshold}% tehtävistä (${completionPercentage}%) ja voit käynnistää analyysin.`;

  return (
    <div className="flex flex-col items-start gap-2">
       <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className={!isEnabled ? 'cursor-not-allowed' : ''}>
                 <Button
                   onClick={onAnalyze}
                   disabled={!isEnabled || isAnalyzing}
                   className={`gap-2 ${!isEnabled ? 'pointer-events-none opacity-50' : ''}`}
                 >
                   {buttonContent}
                 </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{helpText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!isEnabled && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
             <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
             {helpText}
            </p>
        )}
    </div>
  );
};

export default AnalysisButton;