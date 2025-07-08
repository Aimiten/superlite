import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Circle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TaskSelectorProps {
  companyId: string;
  selectedTasks: string[];
  onTasksChange: (tasks: string[]) => void;
  completedOnly?: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  completion_status: string;
  category: string;
  priority: string;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({
  companyId,
  selectedTasks,
  onTasksChange,
  completedOnly = true
}) => {
  const { toast } = useToast();
  const [companyTasks, setCompanyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!companyId) return;

      setLoading(true);
      try {
        // Hae yrityksen tehtävät
        const query = supabase
          .from('company_tasks')
          .select('*')
          .eq('company_id', companyId);

        // Jos halutaan näyttää vain valmiit tehtävät
        if (completedOnly) {
          query.eq('completion_status', 'completed');
        }

        // Järjestä kategoria/prioriteetin mukaan
        query.order('category', { ascending: true })
             .order('priority', { ascending: false })
             .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        setCompanyTasks(data || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast({
          title: "Virhe",
          description: "Tehtävien hakeminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [companyId, toast, completedOnly]);

  const isTaskSelected = (id: string) => {
    return selectedTasks.includes(id);
  };

  const toggleTask = (id: string, checked: boolean) => {
    if (checked) {
      onTasksChange([...selectedTasks, id]);
    } else {
      onTasksChange(selectedTasks.filter(taskId => taskId !== id));
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch(priority) {
      case 'high':
        return <Badge variant="destructive" className="px-1 py-0 text-xs">Korkea</Badge>;
      case 'medium':
        return <Badge variant="default" className="px-1 py-0 text-xs">Normaali</Badge>;
      case 'low':
        return <Badge variant="secondary" className="px-1 py-0 text-xs">Matala</Badge>;
      default:
        return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      financial: "Talous",
      legal: "Juridinen",
      operations: "Toiminta",
      documentation: "Dokumentaatio",
      customers: "Asiakkaat",
      personnel: "Henkilöstö",
      strategy: "Strategia"
    };
    return categories[category] || category;
  };

  return (
    <div className="space-y-4">
      <Label>Valitse jaettavat tehtävät</Label>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500 mr-2" />
          <span className="text-sm text-slate-500">Ladataan tehtäviä...</span>
        </div>
      ) : (
        <>
          {companyTasks.length > 0 ? (
            <ScrollArea className="h-56 border rounded-md p-2">
              {companyTasks.map(task => (
                <div key={task.id} className="flex items-start space-x-2 py-1.5 border-b last:border-b-0">
                  <Checkbox 
                    id={`task-${task.id}`} 
                    checked={isTaskSelected(task.id)}
                    onCheckedChange={(checked) => toggleTask(task.id, !!checked)}
                    className="mt-1"
                  />
                  <div className="flex flex-col">
                    <Label htmlFor={`task-${task.id}`} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span>{task.title}</span>
                        {getPriorityBadge(task.priority)}
                        {task.completion_status === 'completed' && 
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        }
                      </div>
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {getCategoryLabel(task.category)}
                      </span>
                      <p className="text-xs text-slate-500 truncate max-w-[230px]">{task.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          ) : (
            <div className="text-sm text-slate-500 py-4 text-center border rounded-md">
              {completedOnly ? "Ei valmiita tehtäviä saatavilla." : "Ei tehtäviä saatavilla."}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskSelector;