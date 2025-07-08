import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { callEdgeFunction } from "@/utils/edge-function";
import { Task } from "@/components/tasks/TaskTypes"; // Käytä erillistä tyyppitiedostoa

interface TaskResponse {
  task_id: string;
  text_response?: string;
  file_path?: string;
  file_name?: string;
  value?: any;
}

interface UseTaskManagementReturn {
  loading: boolean;
  saving: boolean;
  fetchTasks: (companyId: string) => Promise<Task[]>;
  fetchTask: (taskId: string) => Promise<Task | null>; // Muutettu paluuarvo sallimaan null
  fetchTasksByCategory: (companyId: string, category: string) => Promise<Task[]>;
  fetchTasksByPriority: (companyId: string, priority: string) => Promise<Task[]>;
  updateTaskStatus: (taskId: string, isCompleted: boolean) => Promise<Task | null>; // Muutettu paluuarvo
  saveTaskResponse: (response: TaskResponse) => Promise<any>; // Pidetään any toistaiseksi
  fetchTaskDependencies: (taskId: string) => Promise<Task[]>;
  checkTaskDependencies: (taskId: string) => Promise<{canComplete: boolean, incompleteDependencies: Task[]}>;
  deleteTask: (taskId: string) => Promise<boolean>; // Uusi funktio
  createTask: (taskData: Partial<Task>) => Promise<Task | null>; // Uusi funktio
}

/**
 * Custom hook for managing tasks, including fetching, updating, and handling responses
 */
export function useTaskManagement(): UseTaskManagementReturn {
  console.log("useTaskManagement hook initialized/rerendered");

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Käytä useRef ettei cachedTasks aiheuta riippuvuuslooppia
  const cachedTasksRef = useRef<Record<string, Task[]>>({});
  const lastCompanyIdRef = useRef<string | null>(null);

  /**
   * Fetches all tasks for a specific company
   * === KORJATTU: Wrapattu useCallbackiin ja riippuvuudet määritelty ===
   */
  const fetchTasks = useCallback(async (companyId: string, forceRefresh = false): Promise<Task[]> => {
    console.log("UseTaskManagement fetchTasks called with:", { companyId, forceRefresh });

    if (!companyId) {
      console.error("UseTaskManagement: companyId is empty or undefined");
      return [];
    }

    console.log("UseTaskManagement: Fetching tasks for company ID:", companyId);

    // Käytä välimuistia vain jos forceRefresh on false
    if (!forceRefresh && lastCompanyIdRef.current === companyId && cachedTasksRef.current[companyId]?.length > 0) {
      console.log(`UseTaskManagement: Returning ${cachedTasksRef.current[companyId].length} cached tasks for company ID: ${companyId}`);
      return cachedTasksRef.current[companyId];
    }

    setLoading(true);
    try {
      // Varmistetaan string-tyyppi
      if (typeof companyId !== 'string' || companyId.trim() === '') {
        throw new Error("Invalid companyId format");
      }

      const { data, error } = await supabase
        .from("company_tasks")
        .select("*") // Haetaan kaikki kentät
        .eq("company_id", companyId)
        .order('created_at', { ascending: false }); // Järjestys kannattaa usein tehdä

      if (error) {
        console.error("Error fetching tasks:", error);
        throw error;
      }

      const taskArray = Array.isArray(data) ? data : [];
      console.log(`UseTaskManagement: Fetched ${taskArray.length} tasks for company ID: ${companyId}`);

      // Validoi tehtävät paremmin
      const validatedTasks = taskArray.filter(task => 
        task && typeof task.id === 'string' && typeof task.title === 'string' &&
        task.company_id === companyId && task.category && task.priority && task.type
      );

      if (validatedTasks.length !== taskArray.length) {
        console.warn(`UseTaskManagement: Filtered out ${taskArray.length - validatedTasks.length} invalid tasks`);
      }

      lastCompanyIdRef.current = companyId;
      cachedTasksRef.current[companyId] = validatedTasks;

      return validatedTasks as Task[];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      // Älä näytä toastia tässä, anna kutsujan hoitaa se
      return []; // Palauta aina tyhjä array virhetilanteessa
    } finally {
      setLoading(false);
    }
  }, [toast]); // Riippuvuus vain toastista (ja implisiittisesti Supabasesta)

  /**
   * Fetches a single task by ID
   * === KORJATTU: Wrapattu useCallbackiin, palauttaa null jos ei löydy ===
   */
  const fetchTask = useCallback(async (taskId: string): Promise<Task | null> => {
    if (!taskId) {
      console.error("fetchTask: Task ID is required");
      return null;
    }

    setLoading(true);
    try {
      for (const companyId in cachedTasksRef.current) {
        const task = cachedTasksRef.current[companyId].find(t => t.id === taskId);
        if (task) {
          console.log("UseTaskManagement: Task found in cache:", taskId);
          return task;
        }
      }

      const { data, error } = await supabase
        .from("company_tasks")
        .select("*")
        .eq("id", taskId)
        .maybeSingle(); // Käytä maybeSingle()

      if (error) {
        throw error;
      }

      return data ? data as Task : null; // Palauta data tai null
    } catch (error) {
      console.error("Error fetching task:", error);
      throw error; // Heitä virhe ylöspäin
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches tasks filtered by category
   * === KORJATTU: Wrapattu useCallbackiin ===
   */
  const fetchTasksByCategory = useCallback(async (companyId: string, category: string): Promise<Task[]> => {
    if (!companyId || !category) {
      return [];
    }

    setLoading(true);
    try {
      if (cachedTasksRef.current[companyId]?.length > 0) {
        return cachedTasksRef.current[companyId].filter(task => task.category === category);
      }

      const { data, error } = await supabase
        .from("company_tasks")
        .select("*")
        .eq("company_id", companyId)
        .eq("category", category);

      if (error) throw error;
      return (data || []) as Task[];
    } catch (error) {
      console.error("Error fetching tasks by category:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches tasks filtered by priority
   * === KORJATTU: Wrapattu useCallbackiin ===
   */
  const fetchTasksByPriority = useCallback(async (companyId: string, priority: string): Promise<Task[]> => {
     if (!companyId || !priority) {
      return [];
    }
    setLoading(true);
    try {
      if (cachedTasksRef.current[companyId]?.length > 0) {
        return cachedTasksRef.current[companyId].filter(task => task.priority === priority);
      }
      const { data, error } = await supabase
        .from("company_tasks")
        .select("*")
        .eq("company_id", companyId)
        .eq("priority", priority);

      if (error) throw error;
      return (data || []) as Task[];
    } catch (error) {
      console.error("Error fetching tasks by priority:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches tasks that are dependencies for a given task
   * === KORJATTU: Wrapattu useCallbackiin ===
   */
  const fetchTaskDependencies = useCallback(async (taskId: string): Promise<Task[]> => {
    if (!taskId) return [];
    setLoading(true);
    try {
      let task: Task | null = null;
      for (const companyId in cachedTasksRef.current) {
        const cachedTask = cachedTasksRef.current[companyId].find(t => t.id === taskId);
        if (cachedTask) { task = cachedTask; break; }
      }

      if (!task) {
        const { data: taskData, error: taskError } = await supabase
          .from("company_tasks").select("dependencies").eq("id", taskId).single();
        if (taskError) throw taskError;
        task = taskData as Task;
      }

      if (!task?.dependencies || !Array.isArray(task.dependencies) || task.dependencies.length === 0) {
        return [];
      }

      // Filtteröidään tyhjät ID:t pois
      const validDependencyIds = task.dependencies.filter(id => id && typeof id === 'string');
      if (validDependencyIds.length === 0) return [];

      // Hae riippuvuudet
      const { data, error } = await supabase
        .from("company_tasks").select("*").in("id", validDependencyIds);

      if (error) throw error;
      return (data || []) as Task[];

    } catch (error) {
      console.error("Error fetching task dependencies:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []); // fetchTask ei ole riippuvuus, koska se on useCallback


  /**
   * Checks if all dependencies for a task are completed
   * === KORJATTU: Wrapattu useCallbackiin ===
   */
  const checkTaskDependencies = useCallback(async (taskId: string): Promise<{canComplete: boolean, incompleteDependencies: Task[]}> => {
    if (!taskId) return { canComplete: false, incompleteDependencies: [] };
    try {
      const dependencies = await fetchTaskDependencies(taskId);
      const incompleteDependencies = dependencies.filter(
        (dep) => dep.completion_status !== "completed"
      );
      return { canComplete: incompleteDependencies.length === 0, incompleteDependencies };
    } catch (error) {
      console.error("Error checking task dependencies:", error);
      return { canComplete: false, incompleteDependencies: [] }; // Palauta oletusarvo virheessä
    }
  }, [fetchTaskDependencies]); // Riippuu fetchTaskDependenciesista

  /**
   * Updates a task's completion status
   * === KORJATTU: Wrapattu useCallbackiin, palauttaa null virheessä ===
   */
  const updateTaskStatus = useCallback(async (taskId: string, isCompleted: boolean): Promise<Task | null> => {
    if (!taskId) {
      console.error("updateTaskStatus: Task ID is required");
      return null;
    }

    setSaving(true);
    try {
      // Check dependencies only when marking as completed
      if (isCompleted) {
        const { canComplete, incompleteDependencies } = await checkTaskDependencies(taskId);
        if (!canComplete) {
          const dependencyTitles = incompleteDependencies.map(t => t.title).join(", ");
          toast({
            title: "Riippuvuuksia suorittamatta",
            description: `Sinun täytyy ensin suorittaa seuraavat tehtävät: ${dependencyTitles}`,
            variant: "destructive",
          });
          // ÄLÄ heitä virhettä, jotta UI voi käsitellä tilanteen
          console.warn("Cannot complete task due to dependencies:", dependencyTitles);
          return null; // Palauta null, jotta kutsuja tietää, ettei päivitystä tehty
        }
      }

      // Call edge function (assuming it uses service role or RLS allows this update)
      const { data, error } = await callEdgeFunction("update-task", {
        taskId,
        updateData: {
          completion_status: isCompleted ? "completed" : "not_started",
          // Lisää completed_at tässä tai edge funktiossa
          ...(isCompleted && { completed_at: new Date().toISOString() }),
          ...(!isCompleted && { completed_at: null })
        }
      });

      if (error) throw error;

      // Update cache
      if (data?.task) {
        const updatedTask = data.task as Task;
        const companyId = updatedTask.company_id;
        if (cachedTasksRef.current[companyId]) {
          cachedTasksRef.current[companyId] = cachedTasksRef.current[companyId].map(task =>
            task.id === taskId ? updatedTask : task
          );
        }
        return updatedTask; // Palauta päivitetty tehtävä
      }
      return null; // Palauta null, jos päivitys onnistui mutta data puuttui
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Virhe",
        description: "Tehtävän tilan päivittäminen epäonnistui",
        variant: "destructive",
      });
      return null; // Palauta null virheessä
    } finally {
      setSaving(false);
    }
  }, [checkTaskDependencies, toast]); // Riippuvuudet

  /**
   * Saves a task response (text, file, checkbox, etc.)
   * === KORJATTU: Wrapattu useCallbackiin ===
   */
  const saveTaskResponse = useCallback(async (response: TaskResponse): Promise<any> => {
    if (!response.task_id) {
      console.error("saveTaskResponse: Task ID is required");
      return null; // Palauta null virhetilanteessa
    }

    setSaving(true);
    try {
      // Call edge function
      const { data, error } = await callEdgeFunction("update-task", {
        taskId: response.task_id,
        // Lähetä value-objekti suoraan, jos se on annettu
        updateData: { value: response.value } 
      });

      if (error) throw error;

      // Update cache
      if (data?.task) {
        const updatedTask = data.task as Task;
        const companyId = updatedTask.company_id;
        if (cachedTasksRef.current[companyId]) {
          cachedTasksRef.current[companyId] = cachedTasksRef.current[companyId].map(task =>
            task.id === response.task_id ? updatedTask : task
          );
        }
        return updatedTask; // Palauta päivitetty tehtävä
      }
       return null; // Palauta null, jos päivitys onnistui mutta data puuttui
    } catch (error) {
      console.error("Error saving task response:", error);
      toast({
        title: "Virhe",
        description: "Vastauksen tallentaminen epäonnistui",
        variant: "destructive",
      });
      return null; // Palauta null virheessä
    } finally {
      setSaving(false);
    }
  }, [toast]); // Riippuvuudet

  /**
   * Deletes a task
   */
  const deleteTask = useCallback(async (taskId: string): Promise<boolean> => {
    if (!taskId) {
      console.error("deleteTask: Task ID is required");
      return false;
    }

    setSaving(true);
    try {
      // Hae tehtävä ensin, jotta voimme päivittää välimuistin
      let taskToDelete: Task | null = null;
      let companyId: string | null = null;

      // Etsi ensin välimuistista
      for (const cachedCompanyId in cachedTasksRef.current) {
        const cachedTask = cachedTasksRef.current[cachedCompanyId].find(t => t.id === taskId);
        if (cachedTask) {
          taskToDelete = cachedTask;
          companyId = cachedCompanyId;
          break;
        }
      }

      // Jos ei löydy välimuistista, hae tietokannasta
      if (!taskToDelete) {
        try {
          const { data, error } = await supabase
            .from("company_tasks")
            .select("id, company_id")
            .eq("id", taskId)
            .single();

          if (error) throw error;
          if (data) {
            companyId = data.company_id;
          }
        } catch (fetchError) {
          console.warn("Could not fetch task before deletion:", fetchError);
          // Jatketaan silti poistoa
        }
      }

      // Kutsu edge-funktiota tehtävän poistamiseksi
      const { data, error } = await callEdgeFunction('delete-task', { taskId });

      if (error) {
        throw new Error(error.message || 'Failed to delete task');
      }

      // Tarkista data.success
      if (!data || !data.success) {
        throw new Error((data && data.error) ? data.error : 'Failed to delete task');
      }

      // Päivitä välimuisti jos companyId on saatavilla
      if (companyId && cachedTasksRef.current[companyId]) {
        // Poista poistettu tehtävä
        cachedTasksRef.current[companyId] = cachedTasksRef.current[companyId].filter(
          task => task.id !== taskId
        );
        console.log(`Task ${taskId} removed from cache for company ${companyId}`);

        // Päivitä riippuvuudet backendin palauttaman datan perusteella
        if (data.updatedTasks && Array.isArray(data.updatedTasks) && data.updatedTasks.length > 0) {
          console.log(`Updating ${data.updatedTasks.length} tasks with modified dependencies`);
          
          // Luo Map nopeampaa hakua varten
          const updatedTasksMap = new Map(data.updatedTasks.map((t: Task) => [t.id, t]));
          
          cachedTasksRef.current[companyId] = cachedTasksRef.current[companyId].map(task => {
            const updatedTask = updatedTasksMap.get(task.id);
            if (updatedTask) {
              console.log(`Updated dependencies for task ${task.id}:`, updatedTask.dependencies);
              return { ...task, ...updatedTask }; // Merge säilyttää muut kentät
            }
            return task;
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Virhe",
        description: "Tehtävän poistaminen epäonnistui",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }, [toast]); // Riippuvuus toastista

  /**
   * Creates a new task
   */
  const createTask = useCallback(async (taskData: Partial<Task>): Promise<Task | null> => {
    if (!taskData.company_id || !taskData.title || !taskData.category || !taskData.type) {
      console.error("createTask: Required fields missing");
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await callEdgeFunction('create-task', taskData);
      
      if (error) {
        throw new Error(error.message || 'Failed to create task');
      }
      
      if (!data || !data.success) {
        throw new Error((data && data.error) ? data.error : 'Failed to create task');
      }

      // Add the new task to cache
      if (data.task) {
        const newTask = data.task as Task;
        const companyId = newTask.company_id;

        if (cachedTasksRef.current[companyId]) {
          cachedTasksRef.current[companyId] = [
            newTask,
            ...cachedTasksRef.current[companyId]
          ];
        }

        return newTask;
      }

      return null;
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Virhe",
        description: "Tehtävän luominen epäonnistui",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Tyhjennä välimuisti kun hook luodaan uudelleen (esim. sivun vaihtuessa)
  useEffect(() => {
    cachedTasksRef.current = {};
    lastCompanyIdRef.current = null;
  }, []);

  return {
    loading,
    saving,
    fetchTasks,
    fetchTask,
    fetchTasksByCategory,
    fetchTasksByPriority,
    updateTaskStatus,
    saveTaskResponse,
    fetchTaskDependencies,
    checkTaskDependencies,
    deleteTask,
    createTask
  };
}

export default useTaskManagement;