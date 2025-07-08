// src/components/tasks/TaskCategoryView.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clipboard, LineChart, FileText, Users, BarChart4, Building, Plane } from "lucide-react";
import TaskCard from "./TaskCard"; // Import the TaskCard component
import { Task } from "./TaskTypes"; // Import from the separate types file

interface TaskCategoryViewProps {
  category: string;
  tasks: Task[];
  allTasks: Task[]; // Kaikki tehtävät riippuvuustarkistuksia varten
  onComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
  onSaveResponse: (taskId: string, response: any) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>; // Uusi prop
}

const TaskCategoryView: React.FC<TaskCategoryViewProps> = ({
  category,
  tasks,
  allTasks,
  onComplete,
  onSaveResponse,
  onDelete,
}) => {
  const getCategoryText = (category: string) => {
    switch (category) {
      case "financial": return "Talous";
      case "legal": return "Sopimukset";
      case "operations": return "Toiminta";
      case "documentation": return "Dokumentaatio";
      case "customers": return "Asiakkaat";
      case "personnel": return "Henkilöstö";
      case "strategy": return "Strategia";
      default: return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "financial": 
        return <LineChart className="h-5 w-5" />;
      case "legal": 
        return <Clipboard className="h-5 w-5" />;
      case "operations": 
        return <BarChart4 className="h-5 w-5" />;
      case "documentation": 
        return <FileText className="h-5 w-5" />;
      case "customers": 
        return <Users className="h-5 w-5" />;
      case "personnel": 
        return <Building className="h-5 w-5" />;
      case "strategy": 
        return <Plane className="h-5 w-5" />;
      default:
        return <Clipboard className="h-5 w-5" />;
    }
  };

  // Laskee suoritettujen tehtävien määrän
  const completedCount = tasks.filter(task => task.completion_status === 'completed').length;

  return (
    <Card>
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center text-lg">
          {getCategoryIcon(category)}
          <span className="ml-2">{getCategoryText(category)}</span>
          <Badge variant="outline" className="ml-2">
            {completedCount}/{tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        {tasks.map(task => (
      <TaskCard
        key={task.id}
        task={task}
        allTasks={allTasks}
        onComplete={onComplete}
        onSaveResponse={onSaveResponse}
        onDelete={onDelete} // Välitä onDelete eteenpäin
      />
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Ei tehtäviä tässä kategoriassa
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCategoryView;