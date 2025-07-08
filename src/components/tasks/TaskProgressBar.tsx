import React from "react";
import { cn } from "@/lib/utils";
import { BarChart, CheckCircle, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Task } from "./TaskCard";

interface TaskProgressBarProps {
  tasks: Task[];
  className?: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

interface CategoryProgress {
  category: string;
  completed: number;
  total: number;
  percentage: number;
  label: string;
  color: string;
}

const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  tasks,
  className,
  showDetails = false,
  size = "md",
}) => {
  // Early return if no tasks
  if (!tasks || tasks.length === 0) {
    return (
      <div className={cn("text-center py-4 text-muted-foreground", className)}>
        Ei tehtäviä saatavilla
      </div>
    );
  }

  // Calculate overall progress
  const completedTasks = tasks.filter(
    (task) => task.completion_status === "completed"
  );
  const overallProgress = Math.round(
    (completedTasks.length / tasks.length) * 100
  );

  // Group tasks by category and calculate progress for each
  const categoriesProgress: CategoryProgress[] = Object.entries(
    tasks.reduce<Record<string, { completed: number; total: number }>>(
      (acc, task) => {
        if (!acc[task.category]) {
          acc[task.category] = { completed: 0, total: 0 };
        }
        acc[task.category].total += 1;
        if (task.completion_status === "completed") {
          acc[task.category].completed += 1;
        }
        return acc;
      },
      {}
    )
  ).map(([category, data]) => {
    const categoryLabel = getCategoryText(category);
    const percentage = Math.round((data.completed / data.total) * 100);
    const color = getCategoryColor(category);

    return {
      category,
      completed: data.completed,
      total: data.total,
      percentage,
      label: categoryLabel,
      color,
    };
  }).sort((a, b) => a.label.localeCompare(b.label));

  // Calculate progress by priority
  const priorityProgress = Object.entries(
    tasks.reduce<Record<string, { completed: number; total: number }>>(
      (acc, task) => {
        if (!acc[task.priority]) {
          acc[task.priority] = { completed: 0, total: 0 };
        }
        acc[task.priority].total += 1;
        if (task.completion_status === "completed") {
          acc[task.priority].completed += 1;
        }
        return acc;
      },
      {}
    )
  ).map(([priority, data]) => {
    const priorityLabel = getPriorityText(priority);
    const percentage = Math.round((data.completed / data.total) * 100);
    const color = getPriorityColor(priority);

    return {
      priority,
      completed: data.completed,
      total: data.total,
      percentage,
      label: priorityLabel,
      color,
    };
  }).sort((a, b) => {
    // Sort by priority: high, medium, low
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order];
  });

  // Helper functions
  function getCategoryText(category: string) {
    switch (category) {
      case "financial":
        return "Talous";
      case "legal":
        return "Sopimukset";
      case "operations":
        return "Toiminta";
      case "documentation":
        return "Dokumentaatio";
      case "customers":
        return "Asiakkaat";
      case "personnel":
        return "Henkilöstö";
      case "strategy":
        return "Strategia";
      default:
        return category;
    }
  }

  function getCategoryColor(category: string) {
    switch (category) {
      case "financial":
        return "bg-blue-500";
      case "legal":
        return "bg-purple-500";
      case "operations":
        return "bg-indigo-500";
      case "documentation":
        return "bg-pink-500";
      case "customers":
        return "bg-green-500";
      case "personnel":
        return "bg-orange-500";
      case "strategy":
        return "bg-cyan-500";
      default:
        return "bg-slate-500";
    }
  }

  function getPriorityText(priority: string) {
    switch (priority) {
      case "high":
        return "Korkea";
      case "medium":
        return "Keskitaso";
      case "low":
        return "Matala";
      default:
        return priority;
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-amber-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-slate-500";
    }
  }

  // Size variants for progress bar
  const sizeVariants = {
    sm: {
      container: "space-y-3",
      bar: "h-2",
      labelSize: "text-xs",
      statsSize: "text-sm",
    },
    md: {
      container: "space-y-4",
      bar: "h-3",
      labelSize: "text-sm",
      statsSize: "text-base",
    },
    lg: {
      container: "space-y-5",
      bar: "h-4",
      labelSize: "text-base",
      statsSize: "text-lg",
    },
  };

  const selectedSize = sizeVariants[size];

  // Simple version for the component
  if (!showDetails) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Kokonaisedistyminen</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">{overallProgress}%</span>
            <span className="text-xs text-muted-foreground">
              ({completedTasks.length}/{tasks.length})
            </span>
          </div>
        </div>
        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>
    );
  }

  // Detailed version with categories
  return (
    <div className={cn(selectedSize.container, className)}>
      {/* Overall progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <BarChart className="h-4 w-4 text-muted-foreground" />
            <span className={cn("font-medium", selectedSize.labelSize)}>
              Kokonaisedistyminen
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={cn("font-semibold", selectedSize.statsSize)}>
              {overallProgress}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({completedTasks.length}/{tasks.length})
            </span>
          </div>
        </div>
        <div className={cn("w-full bg-muted rounded-full overflow-hidden", selectedSize.bar)}>
          <div
            className={cn("h-full bg-primary rounded-full transition-all duration-500")}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Category progress */}
      <div className="space-y-3 mt-2">
        {/* Title for categories */}
        <div className="flex items-center gap-1.5">
          <BarChart className="h-4 w-4 text-muted-foreground" />
          <span className={cn("font-medium", selectedSize.labelSize)}>
            Edistyminen kategorioittain
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categoriesProgress.map((category) => (
            <div key={category.category} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={cn("text-muted-foreground", selectedSize.labelSize)}>
                  {category.label}
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn("font-medium", selectedSize.labelSize)}>
                    {category.percentage}%
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>
                          {category.completed}/{category.total} tehtävää valmiina
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className={cn("w-full bg-muted rounded-full overflow-hidden", selectedSize.bar)}>
                <div
                  className={cn("h-full rounded-full transition-all duration-500", category.color)}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priority progress */}
      <div className="space-y-3 mt-2">
        {/* Title for priorities */}
        <div className="flex items-center gap-1.5">
          <BarChart className="h-4 w-4 text-muted-foreground" />
          <span className={cn("font-medium", selectedSize.labelSize)}>
            Edistyminen prioriteeteittain
          </span>
        </div>

        <div className="space-y-2">
          {priorityProgress.map((priority) => (
            <div key={priority.priority} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={cn("text-muted-foreground", selectedSize.labelSize)}>
                  {priority.label}
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn("font-medium", selectedSize.labelSize)}>
                    {priority.percentage}%
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>
                          {priority.completed}/{priority.total} tehtävää valmiina
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <div className={cn("w-full bg-muted rounded-full overflow-hidden", selectedSize.bar)}>
                <div
                  className={cn("h-full rounded-full transition-all duration-500", priority.color)}
                  style={{ width: `${priority.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskProgressBar;