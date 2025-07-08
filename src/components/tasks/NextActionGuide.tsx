// src/components/tasks/NextActionGuide.tsx
import React from "react";
import { ShieldAlert, CheckCircle, ArrowRight, BarChart2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NextActionGuideProps {
  hasAnalysis: boolean;
  hasDDTasks: boolean;
  hasTasks: boolean;
  taskCount: number;
  completionRate: number;
  ddTasksCompletionRate: number;
  onGenerateDDTasks: () => void;
  onAnalyzeImpact: () => void;
  isGeneratingTasks: boolean;
  isAnalyzing: boolean;
}

const NextActionGuide: React.FC<NextActionGuideProps> = ({
  hasAnalysis,
  hasDDTasks,
  hasTasks,
  taskCount,
  completionRate,
  ddTasksCompletionRate,
  onGenerateDDTasks,
  onAnalyzeImpact,
  isGeneratingTasks,
  isAnalyzing,
}) => {
  // Determine which guide to show
  if (!hasTasks || taskCount === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ArrowRight className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">Aloita tehtävien luomisella</h3>
            <p className="text-sm text-gray-600 mt-1">
              Luo tehtäviä parantaaksesi myyntikuntoa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasTasks && !hasAnalysis && completionRate >= 75) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <BarChart2 className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">Laske arvovaikutus</h3>
            <p className="text-sm text-gray-600 mt-1">
              Suoritettu {completionRate}% tehtävistä.
            </p>
            <Button
              size="sm"
              onClick={onAnalyzeImpact}
              disabled={isAnalyzing}
              className="gap-2 mt-2"
            >
              {isAnalyzing ? "Analysoidaan..." : "Analysoi arvovaikutus"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasAnalysis && !hasDDTasks) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">Luo DD-toimenpiteet</h3>
            <p className="text-sm text-gray-600 mt-1">
              Arvovaikutusanalyysi valmis.
            </p>
            <Button
              size="sm"
              onClick={onGenerateDDTasks}
              disabled={isGeneratingTasks}
              className="gap-2 mt-2"
            >
              {isGeneratingTasks ? "Luodaan..." : "Luo DD-tehtävät"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasDDTasks && ddTasksCompletionRate < 0.9) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <ArrowRight className="h-5 w-5 text-gray-600" />
          <div>
            <h3 className="font-medium text-gray-900">Suorita DD-toimenpiteet</h3>
            <p className="text-sm text-gray-600 mt-1">
              Suoritettu {Math.round(ddTasksCompletionRate * 100)}% DD-toimenpiteistä.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (hasDDTasks && ddTasksCompletionRate >= 0.9) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-medium text-gray-900">DD-toimenpiteet suoritettu!</h3>
            <p className="text-sm text-gray-600 mt-1">
              Voit nyt analysoida niiden vaikutuksen arvoon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default NextActionGuide;