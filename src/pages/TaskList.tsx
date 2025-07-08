
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Task } from "@/components/assessment/types";
import { useCompanyTasks } from "@/hooks/use-company-tasks";
import { useCompany } from "@/hooks/use-company";
import { Loader2, CheckCircle, ClipboardCheck, PlusCircle } from "lucide-react";

const TaskList = () => {
  const { toast } = useToast();
  const { companyId } = useParams<{ companyId: string }>();
  const { activeCompany } = useCompany();
  const { fetchTasks, updateTaskStatus } = useCompanyTasks();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const loadTasks = async () => {
      if (!companyId && !activeCompany) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const targetCompanyId = companyId || activeCompany?.id || "";
        const taskData = await fetchTasks(targetCompanyId);
        
        setTasks(taskData);
        setCompletedCount(taskData.filter(task => task.is_completed).length);
      } catch (error) {
        console.error("Error loading tasks:", error);
        toast({
          title: "Virhe",
          description: "Tehtävien lataaminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [companyId, activeCompany, fetchTasks, toast]);

  const handleToggleCompleted = async (taskId: string, currentStatus: boolean) => {
    try {
      const updatedTask = await updateTaskStatus(taskId, !currentStatus);
      
      // Update the tasks list
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, is_completed: !currentStatus } : task
        )
      );
      
      // Update completed count
      setCompletedCount(prev => currentStatus ? prev - 1 : prev + 1);
      
      toast({
        title: currentStatus ? "Tehtävä merkitty keskeneräiseksi" : "Tehtävä merkitty valmiiksi",
        description: updatedTask.title,
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Virhe",
        description: "Tehtävän tilan päivittäminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "financial": return "Talous";
      case "operations": return "Toiminta";
      case "documentation": return "Dokumentaatio";
      case "customers": return "Asiakkaat";
      default: return category;
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case "high": return "Kiireellinen";
      case "medium": return "Keskitärkeä";
      case "low": return "Vähemmän kiireellinen";
      default: return urgency;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-100 text-red-800 hover:bg-red-200";
      case "medium": return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "low": return "bg-green-100 text-green-800 hover:bg-green-200";
      default: return "bg-slate-100 text-slate-800 hover:bg-slate-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "financial":
      case "operations":
      case "documentation":
      case "customers":
      default:
        return <ClipboardCheck className="h-5 w-5" />;
    }
  };

  // Group tasks by category
  const tasksByCategory = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {});

  return (
    <DashboardLayout 
      pageTitle="Tehtävälista" 
      pageDescription={`${completedCount}/${tasks.length} tehtävää suoritettu`}
      showBackButton={true}
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Tehtävät</h2>
              <p className="text-muted-foreground">
                Nämä tehtävät auttavat parantamaan yrityksesi myyntikuntoa ja nostamaan sen arvoa.
              </p>
            </div>
            <Link to="/task-generator">
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Luo uusia tehtäviä
              </Button>
            </Link>
          </div>
          
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center text-lg">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{getCategoryText(category)}</span>
                  <Badge variant="outline" className="ml-2">
                    {categoryTasks.filter(t => t.is_completed).length}/{categoryTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {categoryTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`flex items-center justify-between p-4 border-b last:border-0 ${task.is_completed ? 'bg-muted/30' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h3>
                        <Badge className={getUrgencyColor(task.urgency)}>
                          {getUrgencyText(task.urgency)}
                        </Badge>
                      </div>
                      <p className={`text-sm mt-1 ${task.is_completed ? 'text-muted-foreground' : ''}`}>
                        {task.description.length > 100 
                          ? `${task.description.substring(0, 100)}...` 
                          : task.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={task.is_completed ? "text-green-600" : "text-muted-foreground"}
                        onClick={() => handleToggleCompleted(task.id, task.is_completed)}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                      <Link to={`/tasks/${task.id}`}>
                        <Button variant="outline" size="sm">
                          Avaa
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <ClipboardCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Ei tehtäviä</h2>
          <p className="text-muted-foreground mb-6">
            Yritykselle ei ole vielä luotu tehtäviä. Luodaan uusia tehtäviä parantaaksesi yrityksen myyntikuntoa ja arvoa.
          </p>
          <Link to="/task-generator">
            <Button size="lg" className="gap-2">
              <PlusCircle className="h-5 w-5" />
              Luo tehtäviä
            </Button>
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TaskList;
