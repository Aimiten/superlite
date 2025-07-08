// supabase/functions/analyze-sales-readiness/data/task-organizer.ts

export function organizeTasks(tasks) {
  const categories = {
    financial: [],
    legal: [],
    customers: [],
    personnel: [],
    operations: [],
    documentation: [],
    strategy: [],
    other: []
  };

  // Ryhmittele tehtävät kategoriaan
  tasks.forEach(task => {
    const category = task.category;
    if (category in categories) {
      categories[category].push(task);
    } else {
      categories.other.push(task);
    }
  });

  // Erottele myös tehtävien tila
  const byStatus = {
    completed: tasks.filter(t => t.completion_status === "completed"),
    in_progress: tasks.filter(t => t.completion_status === "in_progress"),
    not_started: tasks.filter(t => t.completion_status === "not_started")
  };

  return { byCategory: categories, byStatus };
}