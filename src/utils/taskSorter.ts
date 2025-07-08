// src/utils/taskSorter.ts
import { Task } from "@/components/tasks/TaskCard";

/**
 * Järjestää tehtävät riippuvuuksien mukaan siten, että tehtävät,
 * joista muut ovat riippuvaisia, tulevat ensin.
 */
export const sortTasksByDependencies = (tasks: Task[]): Task[] => {
  if (!tasks || !Array.isArray(tasks)) return [];

  // Create a map to quickly look up tasks by ID
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  // Track visited nodes and detect cycles
  const visited = new Set<string>();
  const temp = new Set<string>();
  const order: Task[] = [];

  const visit = (taskId: string) => {
    // If we've already processed this node, skip
    if (visited.has(taskId)) return;

    // Check for cycles
    if (temp.has(taskId)) {
      console.warn(`Circular dependency detected involving task ${taskId}`);
      return;
    }

    temp.add(taskId);

    // Process dependencies first
    const currentTask = taskMap.get(taskId);
    if (currentTask && currentTask.dependencies && Array.isArray(currentTask.dependencies)) {
      currentTask.dependencies.forEach(depId => {
        if (depId) visit(depId);
      });
    }

    temp.delete(taskId);
    visited.add(taskId);

    // Add to sorted order
    const task = taskMap.get(taskId);
    if (task) order.push(task);
  };

  // Visit each task to sort them
  tasks.forEach(task => {
    if (task.id) visit(task.id);
  });

  return order;
};