
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskResponse } from "@/components/assessment/types";

export function useCompanyTasks() {
  // Fetch all tasks for a company
  const fetchTasks = useCallback(async (companyId: string) => {
    // We need to use the any type here to bypass TypeScript limitations
    const { data, error } = await (supabase as any)
      .from("company_tasks")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
    
    return data as Task[];
  }, []);

  // Fetch a single task by ID
  const fetchTask = useCallback(async (taskId: string) => {
    const { data, error } = await (supabase as any)
      .from("company_tasks")
      .select("*")
      .eq("id", taskId)
      .single();
      
    if (error) {
      console.error("Error fetching task:", error);
      throw error;
    }
    
    return data as Task;
  }, []);

  // Update a task's completion status
  const updateTaskStatus = useCallback(async (taskId: string, isCompleted: boolean) => {
    const { data, error } = await (supabase as any)
      .from("company_tasks")
      .update({ is_completed: isCompleted })
      .eq("id", taskId)
      .select();
      
    if (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
    
    return data[0] as Task;
  }, []);

  // Get task response
  const fetchTaskResponse = useCallback(async (taskId: string) => {
    const { data, error } = await (supabase as any)
      .from("task_responses")
      .select("*")
      .eq("task_id", taskId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching task response:", error);
      throw error;
    }
    
    return data as TaskResponse | null;
  }, []);

  // Save task response
  const saveTaskResponse = useCallback(async (response: TaskResponse) => {
    if (response.id) {
      // Update existing response
      const { data, error } = await (supabase as any)
        .from("task_responses")
        .update({
          text_response: response.text_response,
          file_path: response.file_path,
          file_name: response.file_name,
        })
        .eq("id", response.id)
        .select();
        
      if (error) {
        console.error("Error updating task response:", error);
        throw error;
      }
      
      return data[0] as TaskResponse;
    } else {
      // Create new response
      const { data, error } = await (supabase as any)
        .from("task_responses")
        .insert({
          task_id: response.task_id,
          text_response: response.text_response,
          file_path: response.file_path,
          file_name: response.file_name,
        })
        .select();
        
      if (error) {
        console.error("Error creating task response:", error);
        throw error;
      }
      
      return data[0] as TaskResponse;
    }
  }, []);

  return {
    fetchTasks,
    fetchTask,
    updateTaskStatus,
    fetchTaskResponse,
    saveTaskResponse
  };
}
