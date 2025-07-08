// src/components/tasks/TaskFilter.tsx
import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X, Filter, BarChart, Clock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Task, FilterState } from "./TaskTypes";

interface TaskFilterProps {
  tasks: Task[];
  onFilterChange: (filters: FilterState) => void;
  className?: string;
}

const initialFilterState: FilterState = {
  categories: [],
  priorities: [],
  impacts: [],
  completionStatus: [],
};

// Predefined options
const PREDEFINED_CATEGORIES = ["financial", "legal", "operations", "documentation", "customers", "personnel", "strategy"];
const PREDEFINED_PRIORITIES = ["high", "medium", "low"];
const PREDEFINED_IMPACTS = ["high", "medium", "low"];
const PREDEFINED_STATUSES = ["completed", "not_started", "in_progress"];

const TaskFilter: React.FC<TaskFilterProps> = ({
  tasks,
  onFilterChange,
  className,
}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [open, setOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Calculate active filter count
  useEffect(() => {
    const count = 
      (filters.categories?.length || 0) + 
      (filters.priorities?.length || 0) + 
      (filters.impacts?.length || 0) + 
      (filters.completionStatus?.length || 0);

    setActiveFilterCount(count);
  }, [filters]);

  // Notify parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (
    filterType: keyof FilterState,
    value: string
  ) => {
    setFilters((prev) => {
      // Create a copy of the current filters
      const newFilters = { ...prev };

      // Ensure each filter array exists
      if (!Array.isArray(newFilters.categories)) newFilters.categories = [];
      if (!Array.isArray(newFilters.priorities)) newFilters.priorities = [];
      if (!Array.isArray(newFilters.impacts)) newFilters.impacts = [];
      if (!Array.isArray(newFilters.completionStatus)) newFilters.completionStatus = [];

      // Handle the specific filter type
      const currentValues = Array.isArray(newFilters[filterType]) ? [...newFilters[filterType]] : [];
      const isSelected = currentValues.includes(value);

      if (isSelected) {
        newFilters[filterType] = currentValues.filter(item => item !== value);
      } else {
        newFilters[filterType] = [...currentValues, value];
      }

      return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters(initialFilterState);
  };

  const handleRemoveFilter = (filterType: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      const currentValues = Array.isArray(newFilters[filterType]) ? [...newFilters[filterType]] : [];
      newFilters[filterType] = currentValues.filter(item => item !== value);
      return newFilters;
    });
  };

  const getCategoryText = (category: string): string => {
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

  const getPriorityText = (priority: string): string => {
    switch (priority) {
      case "high": return "Korkea";
      case "medium": return "Keskitaso";
      case "low": return "Matala";
      default: return priority;
    }
  };

  const getImpactText = (impact: string): string => {
    switch (impact) {
      case "high": return "Suuri";
      case "medium": return "Keskitaso";
      case "low": return "Pieni";
      default: return impact;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "completed": return "Valmiit";
      case "not_started": return "Ei aloitettu";
      case "in_progress": return "Kesken";
      default: return status;
    }
  };

  const getFilterBadgeColor = (filterType: keyof FilterState, value: string): string => {
    if (filterType === "categories") {
      switch (value) {
        case "financial": return "bg-blue-100 text-blue-800 border-blue-200";
        case "legal": return "bg-purple-100 text-purple-800 border-purple-200";
        case "operations": return "bg-indigo-100 text-indigo-800 border-indigo-200";
        case "documentation": return "bg-pink-100 text-pink-800 border-pink-200";
        case "customers": return "bg-green-100 text-green-800 border-green-200";
        case "personnel": return "bg-orange-100 text-orange-800 border-orange-200";
        case "strategy": return "bg-cyan-100 text-cyan-800 border-cyan-200";
        default: return "bg-slate-100 text-slate-800 border-slate-200";
      }
    } else if (filterType === "priorities") {
      switch (value) {
        case "high": return "bg-red-100 text-red-800 border-red-200";
        case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
        case "low": return "bg-green-100 text-green-800 border-green-200";
        default: return "bg-slate-100 text-slate-800 border-slate-200";
      }
    } else if (filterType === "impacts") {
      switch (value) {
        case "high": return "bg-violet-100 text-violet-800 border-violet-200";
        case "medium": return "bg-teal-100 text-teal-800 border-teal-200";
        case "low": return "bg-blue-100 text-blue-800 border-blue-200";
        default: return "bg-slate-100 text-slate-800 border-slate-200";
      }
    } else if (filterType === "completionStatus") {
      switch (value) {
        case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "not_started": return "bg-gray-100 text-gray-800 border-gray-200";
        case "in_progress": return "bg-yellow-100 text-yellow-800 border-yellow-200";
        default: return "bg-slate-100 text-slate-800 border-slate-200";
      }
    }

    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  // Safe getter for filter arrays
  const getFilterArray = (filterType: keyof FilterState): string[] => {
    return Array.isArray(filters[filterType]) ? filters[filterType] : [];
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2 items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="min-w-[200px] justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Suodata tehtäviä</span>
                {activeFilterCount > 0 && (
                  <Badge className="rounded-full bg-primary text-primary-foreground">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Etsi suodattimia..." />
              <CommandList>
                <CommandEmpty>Ei löytynyt suodattimia.</CommandEmpty>

                {/* Categories */}
                <CommandGroup heading="Kategoria">
                  {PREDEFINED_CATEGORIES.map((category) => (
                    <CommandItem
                      key={`category-${category}`}
                      value={`category-${category}`}
                      onSelect={() => handleFilterChange("categories", category)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          getFilterArray("categories").includes(category)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <BarChart className="mr-2 h-4 w-4 text-muted-foreground" />
                      {getCategoryText(category)}
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Priorities */}
                <CommandGroup heading="Prioriteetti">
                  {PREDEFINED_PRIORITIES.map((priority) => (
                    <CommandItem
                      key={`priority-${priority}`}
                      value={`priority-${priority}`}
                      onSelect={() => handleFilterChange("priorities", priority)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          getFilterArray("priorities").includes(priority)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <Flag className="mr-2 h-4 w-4 text-muted-foreground" />
                      {getPriorityText(priority)}
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Impacts */}
                <CommandGroup heading="Vaikutus">
                  {PREDEFINED_IMPACTS.map((impact) => (
                    <CommandItem
                      key={`impact-${impact}`}
                      value={`impact-${impact}`}
                      onSelect={() => handleFilterChange("impacts", impact)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          getFilterArray("impacts").includes(impact)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      {getImpactText(impact)}
                    </CommandItem>
                  ))}
                </CommandGroup>

                {/* Completion Status */}
                <CommandGroup heading="Tila">
                  {PREDEFINED_STATUSES.map((status) => (
                    <CommandItem
                      key={`status-${status}`}
                      value={`status-${status}`}
                      onSelect={() => handleFilterChange("completionStatus", status)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          getFilterArray("completionStatus").includes(status)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {getStatusText(status)}
                    </CommandItem>
                  ))}
                </CommandGroup>

                {activeFilterCount > 0 && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center"
                      onClick={handleClearFilters}
                    >
                      Tyhjennä kaikki suodattimet
                    </Button>
                  </div>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Filter badges */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {getFilterArray("categories").map((category) => (
              <Badge
                key={`badge-category-${category}`}
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 flex items-center gap-1",
                  getFilterBadgeColor("categories", category)
                )}
              >
                {getCategoryText(category)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("categories", category)}
                />
              </Badge>
            ))}

            {getFilterArray("priorities").map((priority) => (
              <Badge
                key={`badge-priority-${priority}`}
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 flex items-center gap-1",
                  getFilterBadgeColor("priorities", priority)
                )}
              >
                {getPriorityText(priority)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("priorities", priority)}
                />
              </Badge>
            ))}

            {getFilterArray("impacts").map((impact) => (
              <Badge
                key={`badge-impact-${impact}`}
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 flex items-center gap-1",
                  getFilterBadgeColor("impacts", impact)
                )}
              >
                {getImpactText(impact)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("impacts", impact)}
                />
              </Badge>
            ))}

            {getFilterArray("completionStatus").map((status) => (
              <Badge
                key={`badge-status-${status}`}
                variant="outline"
                className={cn(
                  "rounded-full px-3 py-1 flex items-center gap-1",
                  getFilterBadgeColor("completionStatus", status)
                )}
              >
                {getStatusText(status)}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveFilter("completionStatus", status)}
                />
              </Badge>
            ))}

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleClearFilters}
              >
                Tyhjennä kaikki
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskFilter;