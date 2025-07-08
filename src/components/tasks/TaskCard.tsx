// src/components/tasks/TaskCard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Task } from "./TaskTypes";
import { TaskImpactIndicator } from "./TaskImpactIndicator";
import TaskResponseModal from "./TaskResponseModal";

import { 
  Loader2, AlertCircle, User, Mail, Phone, Eye, PanelRight,
  Building, MapPin, Bot, Lock, CheckCircle, X, MoreVertical, 
  Trash, FileText, Clock, ShieldAlert
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskCardProps {
  task: Task & { dd_related?: boolean };
  allTasks?: Task[];
  onComplete: (taskId: string, isCompletedCurrently: boolean) => Promise<void>;
  onSaveResponse?: (taskId: string, responseValue: any) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  allTasks = [],
  onComplete,
  onSaveResponse,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [disabledDueToDependendies, setDisabledDueToDependendies] = useState(false);
  const [responseModalOpen, setResponseModalOpen] = useState(false);

  // AI-avustaja-navigointifunktio
  const handleAIHelp = () => {
    navigate(`/ai-assistant?taskId=${task.id}&taskTitle=${encodeURIComponent(task.title)}&taskDescription=${encodeURIComponent(task.description)}&taskType=${task.type}`);
  };

  // Tarkista riippuvuudet, kun tehtävät muuttuvat
  useEffect(() => {
    if (task.dependencies && task.dependencies.length > 0 && allTasks.length > 0) {
      // Tarkistetaan, ovatko kaikki riippuvuudet valmiita
      const allDependenciesCompleted = task.dependencies.every(depId => {
        const depTask = allTasks.find(t => t.id === depId);
        return depTask?.completion_status === 'completed';
      });
      setDisabledDueToDependendies(!allDependenciesCompleted);
    } else {
      setDisabledDueToDependendies(false);
    }
  }, [task.dependencies, allTasks]);

  // Helper-funktiot
  const getCategoryText = (category: string): string => {
    const map: Record<string, string> = { financial: "Talous", legal: "Sopimukset", operations: "Toiminta", documentation: "Dokumentaatio", customers: "Asiakkaat", personnel: "Henkilöstö", strategy: "Strategia" };
    return map[category] || category;
  };
  const getCategoryColor = (category: string): string => {
     const map: Record<string, string> = { financial: "bg-blue-100 text-blue-800", legal: "bg-purple-100 text-purple-800", operations: "bg-indigo-100 text-indigo-800", documentation: "bg-pink-100 text-pink-800", customers: "bg-green-100 text-green-800", personnel: "bg-orange-100 text-orange-800", strategy: "bg-cyan-100 text-cyan-800" };
    return map[category] || "bg-slate-100 text-slate-800";
  };
  const getPriorityText = (priority: string): string => {
     const map: Record<string, string> = { high: "Korkea", medium: "Keskitaso", low: "Matala" };
    return map[priority] || priority;
  };
   const getPriorityColor = (priority: string): string => {
     const map: Record<string, string> = { high: "bg-red-100 text-red-800", medium: "bg-amber-100 text-amber-800", low: "bg-green-100 text-green-800" };
    return map[priority] || "bg-slate-100 text-slate-800";
  };
   const getImpactText = (impact?: string | null): string => {
     if (!impact) return "Ei määritelty";
     const map: Record<string, string> = { high: "Suuri vaikutus", medium: "Keskitasoinen vaikutus", low: "Pieni vaikutus" };
    return map[impact] || impact;
  };

  // Käsittelee tehtävän tilan muutoksen
  const handleCompleteTask = async () => {
    // Jos riippuvuudet eivät ole valmiita, estetään tehtävän suoritus
    if (disabledDueToDependendies) {
      return; // Nappi on disabled, mutta tämä on varmuudeksi
    }

    setIsCompleting(true);
    try {
      await onComplete(task.id, task.completion_status === 'completed');
    } catch (error) {
      // Virheenkäsittely tapahtuu kutsuvassa komponentissa (esim. TaskDashboard) hookin kautta
      console.error("Error updating task status (TaskCard):", error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Käsittelee tehtävän poistamisen
  const handleDeleteTask = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(task.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting task (TaskCard):", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Renderöi riippuvuusindikaattori
  const renderDependencies = () => {
    if (!task.dependencies || !Array.isArray(task.dependencies) || task.dependencies.length === 0 || !allTasks || !Array.isArray(allTasks) || allTasks.length === 0) {
      return null;
    }

    // Hae riippuvuustehtävät
    const dependencyTasks = task.dependencies && Array.isArray(task.dependencies) 
      ? task.dependencies.map(depId => {
          const depTask = allTasks.find(t => t.id === depId);
          return {
            id: depId,
            title: depTask?.title || "Tuntematon tehtävä",
            isCompleted: depTask?.completion_status === 'completed',
            exists: !!depTask
          };
        })
      : [];

    return (
      <div className="mt-3 border-t pt-3">
        <div className="flex items-center gap-1.5 text-sm mb-1">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Riippuvuudet:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {dependencyTasks.map(dep => (
            <Badge 
              key={dep.id}
              variant="outline"
              className={`${
                dep.isCompleted 
                  ? "border-green-200 bg-green-50 text-green-700" 
                  : "bg-amber-50 border-amber-200 text-amber-700"
              } ${dep.exists ? "" : "opacity-50"}`}
            >
              {dep.title} {dep.isCompleted ? '✓' : ''}
            </Badge>
          ))}
        </div>
        {disabledDueToDependendies && (
          <p className="text-xs text-amber-600 mt-1">
            Suorita ensin riippuvuudet ennen tämän tehtävän tekemistä.
          </p>
        )}
      </div>
    );
  };

  // Renderöi vastauksen näyttö/muokkaus-painike
  const renderResponseButton = () => {
    // Tarkista onko tehtävällä oikeasti sisältöä
    let hasResponse = false;
    
    if (task.value) {
      switch (task.type) {
        case 'text_input':
        case 'explanation':
          hasResponse = !!(task.value.text && task.value.text.trim());
          break;
        case 'checkbox':
          hasResponse = task.value.checked === true;
          break;
        case 'multiple_choice':
          hasResponse = !!(task.value.options && Array.isArray(task.value.options) && task.value.options.length > 0);
          break;
        case 'contact_info':
          hasResponse = !!(task.value.contact && task.value.contact.name && task.value.contact.name.trim());
          break;
        case 'document_upload':
          hasResponse = !!(
            (task.value.filePath && task.value.fileName) || 
            (task.value.textResponse && task.value.textResponse.trim())
          );
          break;
        default:
          // Tarkista onko kyseessä tyhjä objekti
          hasResponse = Object.keys(task.value).length > 0;
      }
    }
    
    // Määritä näytettävä teksti sen perusteella, onko oikeasti sisältöä
    let buttonText = hasResponse 
      ? (task.completion_status === 'completed' ? 'Näytä vastaus' : 'Muokkaa vastausta')
      : 'Vastaa tehtävään';
    
    return (
      <div className="mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setResponseModalOpen(true)}
          className="w-full justify-center gap-1.5"
          disabled={disabledDueToDependendies}
        >
          <Eye className="h-3.5 w-3.5" />
          {buttonText}
        </Button>
      </div>
    );
  };

  return (
    <>
      <Card className={`transition-opacity ${
        task.completion_status === 'completed' 
          ? 'opacity-70 shadow-none border border-slate-200' 
          : task.dd_related 
            ? 'opacity-100 shadow-md border-2 border-purple-300 bg-purple-50/30' 
            : 'opacity-100 shadow-md border border-slate-200'
      }`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            {/* Tehtävän tiedot */}
            <div className="flex-grow space-y-1">
              <h3 className={`font-medium text-lg flex items-center gap-2 ${task.completion_status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {task.dd_related && (
                  <ShieldAlert className="h-5 w-5 text-purple-600 flex-shrink-0" />
                )}
                {task.title}
              </h3>
              {/* Badget ja indikaattori */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Badge className={`${getCategoryColor(task.category)} flex-shrink-0`}>
                  {getCategoryText(task.category)}
                </Badge>
                <Badge className={`${task.dd_related ? 'bg-purple-100 text-purple-800' : getPriorityColor(task.priority)} flex-shrink-0`}>
                  {task.dd_related ? 'DD-kriittinen' : getPriorityText(task.priority)}
                </Badge>

                {/* DD-tehtävien badge */}
                {task.dd_related && (
                  <Badge 
                    variant="outline" 
                    className="bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1 flex-shrink-0"
                  >
                    <AlertCircle className="h-3 w-3" />
                    <span>DD-toimenpide</span>
                  </Badge>
                )}

                {task.estimated_time && (
                  <Badge variant="outline" className="gap-1 flex-shrink-0 text-xs">
                    <Clock className="h-3 w-3" />
                    {task.estimated_time}
                  </Badge>
                )}
                {/* Arvovaikutusindikaattori */}
                <TaskImpactIndicator impact={task.impact} category={task.category} />
              </div>
            </div>
            {/* Toimintovalikko */}
            {onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Poista tehtävä
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent>
           {/* Kuvaus */}
           {task.description && (
              <p className={`mb-4 text-sm ${task.completion_status === 'completed' ? 'text-muted-foreground' : ''}`}>
                {task.description}
              </p>
           )}

          {/* Odotettu lopputulos */}
          {task.expected_outcome && (
            <div className="bg-slate-50 p-3 rounded-md mb-4 text-sm border border-slate-200">
              <p className="font-medium text-slate-700">Odotettu lopputulos:</p>
              <p className="text-slate-600 mt-1">{task.expected_outcome}</p>
            </div>
          )}

          {/* Vaikutus myyntikuntoon */}
          {task.impact && (
            <div className="bg-slate-50 p-3 rounded-md mb-4 flex items-start gap-2 text-sm border border-slate-200">
              <AlertCircle className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700">Vaikutus myyntikuntoon</p>
                <p className="text-slate-600 mt-1">{getImpactText(task.impact)}</p>
              </div>
            </div>
          )}

          {/* Näytä riippuvuudet */}
          {renderDependencies()}

          {/* Näytä vastauksen painike */}
          {onSaveResponse && renderResponseButton()}

          {/* Painikkeet samalla rivillä ilman erottavaa viivaa */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {/* AI-avustaja-painike */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAIHelp}
              className="gap-2 flex-1"
            >
              <Bot className="h-4 w-4" />
              Kysy AI:lta apua
            </Button>

            {/* "Merkitse valmiiksi" -painike */}
            {(task.completion_status !== 'completed' || onComplete) && (
              <Button
                variant={task.completion_status === 'completed' ? "outline" : "default"}
                size="sm"
                onClick={handleCompleteTask}
                disabled={isCompleting || disabledDueToDependendies}
                className="gap-2 flex-1"
              >
                {isCompleting ? ( <Loader2 className="h-4 w-4 animate-spin" /> ) : ( <CheckCircle className="h-4 w-4" /> )}
                {task.completion_status === 'completed' ? 'Merkitse keskeneräiseksi' : 'Merkitse valmiiksi'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tehtävän vastauksen modaali */}
      {onSaveResponse && (
        <TaskResponseModal
          isOpen={responseModalOpen}
          onClose={() => setResponseModalOpen(false)}
          task={task}
          onSaveResponse={onSaveResponse}
          onComplete={onComplete} // Välitetään callback eteenpäin
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vahvista tehtävän poistaminen</DialogTitle>
            <DialogDescription>
              Oletko varma, että haluat poistaa tehtävän "{task.title}"? Tätä toimintoa ei voi peruuttaa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Peruuta</Button>
            </DialogClose>
            <Button 
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Poistetaan...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Poista tehtävä
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskCard;