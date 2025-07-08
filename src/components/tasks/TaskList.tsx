// src/components/tasks/TaskList.tsx
import React, { useState, useEffect } from "react";
import TaskCategoryView from "./TaskCategoryView";
import TaskFilter from "./TaskFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PlusCircle, FileText } from "lucide-react";
import { sortTasksByDependencies } from "@/utils/taskSorter";
import { TaskCreationButton } from "./TaskCreationModal";
import { Task, FilterState } from "./TaskTypes"; // Import from separate types file

interface TaskListProps {
  tasks: Task[];
  onComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
  onSaveResponse: (taskId: string, response: any) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>; // Uusi prop
  showFilters?: boolean;
  showEmptyState?: boolean;
  allTasks?: Task[]; // Lisätty allTasks prop
}

/**
 * Component that lists tasks by categories and provides filtering options.
 */
const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onComplete,
  onSaveResponse,
  onDelete, // Receive onDelete prop
  showFilters = true,
  showEmptyState = true,
  allTasks
}) => {
  // IMPORTANT: All hooks are at the top level and will always be called in the same order
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priorities: [],
    impacts: [],
    completionStatus: [],
  });

  // Ensure tasks is always an array
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  const isEmpty = tasksArray.length === 0;

  // Käytä allTasks-propsia jos on annettu, muuten käytä tasks-propsia
  const allTasksArray = Array.isArray(allTasks) ? allTasks : tasksArray;

  // Apply filters when tasks or filters change - always executed regardless of task count
  useEffect(() => {
    console.log("TaskList: useEffect - tasks päivittyi:", tasksArray.length, "tehtävää");

    if (isEmpty) {
      setFilteredTasks([]);
      return;
    }

    let result = [...tasksArray];

    // Filter by category
    if (filters.categories.length > 0) {
      result = result.filter((task) => filters.categories.includes(task.category));
    }

    // Filter by priority
    if (filters.priorities.length > 0) {
      result = result.filter((task) => filters.priorities.includes(task.priority));
    }

    // Filter by impact
    if (filters.impacts.length > 0) {
      result = result.filter((task) => filters.impacts.includes(task.impact));
    }

    // Filter by completion status
    if (filters.completionStatus.length > 0) {
      result = result.filter((task) => 
        filters.completionStatus.includes(task.completion_status)
      );
    }

    // Apply tab filters
    if (activeTab === "completed") {
      result = result.filter((task) => task.completion_status === "completed");
    } else if (activeTab === "pending") {
      result = result.filter((task) => task.completion_status !== "completed");
    } else if (activeTab !== "all" && activeTab !== "completed" && activeTab !== "pending") {
      // If tab is a category name
      result = result.filter((task) => task.category === activeTab);
    }

    // Järjestä tehtävät riippuvuuksien mukaan
    const sortedResult = sortTasksByDependencies(result);
    setFilteredTasks(sortedResult);
  }, [tasksArray, filters, activeTab, isEmpty]);

  // Group tasks by category - varmista että filteredTasks on array
  const tasksByCategory = filteredTasks.reduce<Record<string, Task[]>>(
    (acc, task) => {
      if (task && task.category) { // Varmista että task ja category ovat olemassa
        if (!acc[task.category]) {
          acc[task.category] = [];
        }
        acc[task.category].push(task);
      } else {
        console.warn("TaskList: Kohdattiin task ilman kategoriaa", task);
      }
      return acc;
    },
    {}
  );

  // Get unique categories for tabs - moved within the same function scope
  const categories = Object.keys(
    tasksArray.reduce<Record<string, boolean>>((acc, task) => {
      if(task && task.category){
        acc[task.category] = true;
      }
      return acc;
    }, {})
  ).sort();

  // Count completed tasks
  const completedCount = tasksArray.filter(
    (task) => task.completion_status === "completed"
  ).length;

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // RENDER SECTION
  // Empty state rendering (moved inside the main return)
  if (isEmpty && showEmptyState) {
    console.log("TaskList: Näytetään tyhjä tila, tasks.length =", tasksArray.length);
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Ei tehtäviä</h2>
        <p className="text-muted-foreground mb-6">
          Yritykselle ei ole vielä luotu tehtäviä. Luo tehtäviä parantaaksesi
          yrityksen myyntikuntoa ja arvoa.
        </p>
        <Link to="/task-generator">
          <Button size="lg" className="gap-2 text-white">
            <PlusCircle className="h-5 w-5 text-white" />
            Luo tehtäviä
          </Button>
        </Link>
      </div>
    );
  }

  // Main content render (tasks list)
  return (
    <div className="space-y-6">
      {showFilters && (
        <TaskFilter
          tasks={tasksArray}
          onFilterChange={handleFilterChange}
          className="mb-6"
        />
      )}

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex overflow-auto pb-2">
          <TabsList className="mr-2 flex-nowrap">
            <TabsTrigger value="all" className="whitespace-nowrap">
              Kaikki tehtävät
            </TabsTrigger>
            <TabsTrigger value="pending" className="whitespace-nowrap">
              Keskeneräiset ({tasksArray.length - completedCount})
            </TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-nowrap">
              Valmiit ({completedCount})
            </TabsTrigger>
          </TabsList>

          <TabsList className="flex-nowrap">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="whitespace-nowrap"
              >
                {getCategoryText(category)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="all" className="space-y-6 mt-6">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <TaskCategoryView
              key={category}
              category={category}
              tasks={categoryTasks}
              allTasks={allTasksArray}
              onComplete={onComplete}
              onSaveResponse={onSaveResponse}
              onDelete={onDelete} // Välitä onDelete eteenpäin
            />
          ))}

          {Object.keys(tasksByCategory).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ei hakuehtoja vastaavia tehtäviä.
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-6 mt-6">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
            const pendingTasks = categoryTasks.filter(
              (task) => task.completion_status !== "completed"
            );
            if (pendingTasks.length === 0) return null;

            return (
              <TaskCategoryView
                key={category}
                category={category}
                tasks={pendingTasks}
                allTasks={allTasksArray}
                onComplete={onComplete}
                onSaveResponse={onSaveResponse}
                onDelete={onDelete} // Välitä onDelete eteenpäin
              />
            );
          })}

          {Object.keys(tasksByCategory).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ei hakuehtoja vastaavia keskeneräisiä tehtäviä.
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6 mt-6">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
            const completedTasks = categoryTasks.filter(
              (task) => task.completion_status === "completed"
            );
            if (completedTasks.length === 0) return null;

            return (
              <TaskCategoryView
                key={category}
                category={category}
                tasks={completedTasks}
                allTasks={allTasksArray}
                onComplete={onComplete}
                onSaveResponse={onSaveResponse}
                onDelete={onDelete} // Välitä onDelete eteenpäin
              />
            );
          })}

          {Object.keys(tasksByCategory).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ei hakuehtoja vastaavia valmiita tehtäviä.
            </div>
          )}
        </TabsContent>

        {/* Category tabs */}
        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-6 mt-6">
            {tasksByCategory[category] ? (
              <TaskCategoryView
                category={category}
                tasks={tasksByCategory[category]}
                allTasks={allTasksArray}
                onComplete={onComplete}
                onSaveResponse={onSaveResponse}
                onDelete={onDelete} // Välitä onDelete eteenpäin
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Ei hakuehtoja vastaavia tehtäviä tässä kategoriassa.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Helper function for category text
function getCategoryText(category: string) {
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
}

export default TaskList;