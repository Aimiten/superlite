// supabase/functions/delete-task/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DeleteTaskRequest {
  taskId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase environment variables are not set");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse the request
    const requestData: DeleteTaskRequest = await req.json();
    const { taskId } = requestData;

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    console.log(`Processing deletion for task ${taskId}`);

    // 1. Get the task to be deleted to check for any information we need before deletion
    const { data: taskToDelete, error: getTaskError } = await supabase
      .from('company_tasks')
      .select('*')
      .eq('id', taskId)
      .maybeSingle();

    if (getTaskError) {
      throw new Error(`Failed to fetch task: ${getTaskError.message}`);
    }

    if (!taskToDelete) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    // 2. Find any tasks that have this task as a dependency - KORJATTU
    let dependentTasks = [];
    let dependentTasksError = null;

    // Vain jos taskId on validi, hae riippuvuudet
    if (taskId) {
      try {
        // Käytä PostgreSQL @> operaattoria joka toimii JSONB-arrayn kanssa
        const { data, error } = await supabase
          .from('company_tasks')
          .select('id, title, dependencies')
          .filter('dependencies', 'cs', `["${taskId}"]`);

        dependentTasks = data || [];
        dependentTasksError = error;

        console.log(`Found ${dependentTasks.length} tasks with dependencies on task ${taskId}`);
      } catch (error) {
        console.error("Error fetching dependent tasks:", error);
        dependentTasksError = error;
        // Jatketaan poistoa vaikka riippuvuuksien haku epäonnistuisi
      }
    }

    // 3. Update tasks that have this task as a dependency
    const updatedTasks = [];
    
    if (dependentTasks && dependentTasks.length > 0) {
      console.log(`Found ${dependentTasks.length} tasks with dependencies on task ${taskId}`);

      for (const task of dependentTasks) {
        try {
          // Varmista että dependencies on taulukko
          let dependencies = Array.isArray(task.dependencies) ? [...task.dependencies] : [];

          // Poista poistettava tehtävä riippuvuuksista
          const updatedDependencies = dependencies.filter(depId => depId !== taskId);

          const { data: updatedTask, error: updateError } = await supabase
            .from('company_tasks')
            .update({ dependencies: updatedDependencies })
            .eq('id', task.id)
            .select()
            .single();

          if (updateError) {
            console.error(`Error updating dependencies for task ${task.id}:`, updateError);
          } else if (updatedTask) {
            console.log(`Successfully updated task ${task.id}, new dependencies:`, updatedTask.dependencies);
            updatedTasks.push(updatedTask);
          } else {
            console.warn(`No data returned when updating task ${task.id}`);
          }
        } catch (taskError) {
          console.error(`Error processing dependencies for task ${task.id}:`, taskError);
        }
      }
    }

    // 4. If task has uploaded files, delete them from storage
    if (taskToDelete.value?.filePath) {
      const bucketName = "task-files"; // Default bucket name
      try {
        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .remove([taskToDelete.value.filePath]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Continue with task deletion even if file deletion fails
        }
      } catch (fileError) {
        console.error("Error during file deletion:", fileError);
        // Continue with task deletion
      }
    }

    // 5. Finally delete the task
    const { error: deleteError } = await supabase
      .from('company_tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      throw new Error(`Failed to delete task: ${deleteError.message}`);
    }

    console.log(`Task ${taskId} deleted successfully`);
    console.log(`Returning response with ${updatedTasks.length} updated tasks`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Task deleted successfully",
        taskId,
        updatedTasks: updatedTasks
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error deleting task:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});