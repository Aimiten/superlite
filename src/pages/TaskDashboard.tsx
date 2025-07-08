// src/pages/TaskDashboard.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Task, FilterState } from "@/components/tasks/TaskTypes";
import TaskList from "@/components/tasks/TaskList";
import TaskProgressBar from "@/components/tasks/TaskProgressBar";
import NewTasksNotification from "@/components/tasks/NewTasksNotification";
import { useCompany } from "@/hooks/use-company";
import { useValuationStore } from "@/stores/valuationStore";
import { useTaskManagement } from "@/hooks/UseTaskManagement";
import { useValuationImpact } from '@/hooks/useValuationImpact';
import { AnalysisButton } from "@/components/tasks/AnalysisButton";
import { ValuationImpactSummary } from "@/components/tasks/ValuationImpactSummary";
import { ValuationImpactTab } from "@/components/tasks/ValuationImpactTab";
import AnalysisAlert from "@/components/tasks/AnalysisAlert";
import { sortTasksByDependencies } from "@/utils/taskSorter";
import { callEdgeFunction } from "@/utils/edge-function";
import CompanySelector from "@/components/assessment/CompanySelector";
import { TaskCreationModal } from "@/components/tasks/TaskCreationModal"; // Nyt importataan TaskCreationModal suoraan
import { supabase } from "@/integrations/supabase/client"; // Lisätty supabase-import
import EmptyTaskView from "@/components/tasks/EmptyTaskView";
import TaskCreationDropdown from "@/components/tasks/TaskCreationDropdown";
import NextActionGuide from "@/components/tasks/NextActionGuide";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  PlusCircle,
  Check,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  FileText,
  CheckCircle,
  ShieldAlert,
  FilePlus2,
  Brain
} from "lucide-react";

/**
 * Enhanced logging utility function
 */
const LOG_PREFIX = "TaskDashboard";
const log = (area, message, data = null) => {
  const timestamp = new Date().toISOString().substr(11, 12);
  console.log(`[${timestamp}][${LOG_PREFIX}][${area}] ${message}`, data !== null ? data : '');
};

// Simple helper function for category text
function getCategoryText(category: string): string { 
  const mapping = {
    "financial": "Talous",
    "legal": "Sopimukset",
    "operations": "Toiminta",
    "documentation": "Dokumentaatio",
    "customers": "Asiakkaat",
    "personnel": "Henkilöstö",
    "strategy": "Strategia"
  };
  return mapping[category] || category; 
}

const TaskDashboard: React.FC = () => {
  // --- React hooks ---
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- State management ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('tehtavat');
  const [tasksLoading, setTasksLoading] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isDDAnalyzing, setIsDDAnalyzing] = useState(false);
  const [showAnalysisAlert, setShowAnalysisAlert] = useState(false);
  const [analysisType, setAnalysisType] = useState<'valuation' | 'dd'>('valuation');
  const prevIsAnalyzingRef = useRef(false);
  // Uusi tila DD-analyysille

  // Track previous props to detect changes
  const prevActiveCompanyId = useRef<string | null>(null);
  const prevDataFetched = useRef<boolean>(false);

  // --- IMPORTANT: Only extract what we need from custom hooks ---
  // From useCompany, only extract the minimal needed properties
  const { activeCompany, dataFetched } = useCompany();
  const currentCompanyId = activeCompany?.id;

  // From useValuationStore, only extract the latestValuationId
  const latestValuationId = useValuationStore((state) => state.latestValuationId);

  // From useTaskManagement, only extract the functions we need, not the state
  const { 
    fetchTasks: originalFetchTasks, 
    updateTaskStatus: originalUpdateTaskStatus,
    saveTaskResponse: originalSaveTaskResponse,
    deleteTask: originalDeleteTask,
    createTask: originalCreateTask
  } = useTaskManagement();

  // From useValuationImpact, selectively extract only what we need
  const { 
    analyzeValuationImpact: originalAnalyzeValuationImpact,
    analyzePostDDImpact: originalAnalyzePostDDImpact, // Lisää tämä
    fetchLatestAnalysis: originalFetchLatestAnalysis,
    valuationImpact,
    isAnalyzing,
    hasAnalysis,
    error: analysisError
  } = useValuationImpact();

  // --- Stable callbacks ---
  const fetchTasks = useCallback(async (companyId: string, forceRefresh = false) => {
    if (!companyId) return [];
    log("Callbacks", `fetchTasks called with companyId=${companyId}, forceRefresh=${forceRefresh}`);
    try {
      return await originalFetchTasks(companyId, forceRefresh);
    } catch (err) {
      console.error("Error in fetchTasks:", err);
      return [];
    }
  }, [originalFetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, isCompletedCurrently: boolean) => {
    log("Callbacks", `updateTaskStatus called with taskId=${taskId}, isCompleted=${isCompletedCurrently}`);
    return originalUpdateTaskStatus(taskId, isCompletedCurrently);
  }, [originalUpdateTaskStatus]);

  const saveTaskResponse = useCallback(async (taskId: string, responseValue: any) => {
    log("Callbacks", `saveTaskResponse called with taskId=${taskId}`);
    return originalSaveTaskResponse({ task_id: taskId, value: responseValue });
  }, [originalSaveTaskResponse]);

  const deleteTask = useCallback(async (taskId: string) => {
    log("Callbacks", `deleteTask called with taskId=${taskId}`);
    return originalDeleteTask(taskId);
  }, [originalDeleteTask]);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    log("Callbacks", `createTask called with title=${taskData.title}`);
    return originalCreateTask(taskData);
  }, [originalCreateTask]);

  const fetchLatestAnalysis = useCallback(async (companyId: string) => {
    log("Callbacks", `fetchLatestAnalysis called with companyId=${companyId}`);
    return originalFetchLatestAnalysis(companyId);
  }, [originalFetchLatestAnalysis]);

  const analyzeValuationImpact = useCallback(async (companyId: string, valuationId: string | null) => {
    log("Callbacks", `analyzeValuationImpact called with companyId=${companyId}, valuationId=${valuationId}`);
    return originalAnalyzeValuationImpact(companyId, valuationId);
  }, [originalAnalyzeValuationImpact]);

  // Lisää tämä uusi callback-funktio muiden callback-funktioiden joukkoon
  const analyzePostDDImpact = useCallback(async (companyId: string, previousAnalysisId: string, valuationId: string | null) => {
    log("Callbacks", `analyzePostDDImpact called with companyId=${companyId}, previousId=${previousAnalysisId}, valuationId=${valuationId}`);
    return originalAnalyzePostDDImpact(companyId, previousAnalysisId, valuationId);
  }, [originalAnalyzePostDDImpact]);

  // --- Event handlers ---
  const handleGenerateDDTasks = useCallback(async () => {
    if (!currentCompanyId || !valuationImpact || !valuationImpact.dd_risk_analysis) {
      toast({
        title: "Virhe",
        description: "DD-analyysia ei ole saatavilla tehtävien luomiseksi",
        variant: "destructive"
      });
      return;
    }

    log("DD-Tasks", `Generating DD tasks for company ${currentCompanyId}`);
    setIsGeneratingTasks(true);

    try {
      // Lisätty debug-lokitus ennen callEdgeFunction-kutsua
      console.log("DD-analyysi rakenne:", {
        tyyppi: typeof valuationImpact.dd_risk_analysis,
        avaimet: Object.keys(valuationImpact.dd_risk_analysis),
        kokonaisRiskitaso: valuationImpact?.dd_risk_analysis?.kokonaisRiskitaso
      });

      const response = await callEdgeFunction("generate-dd-tasks", {
        companyId: currentCompanyId,
        ddRiskAnalysis: valuationImpact.dd_risk_analysis
      });

      // Lisätty debug-lokitus callEdgeFunction-kutsun jälkeen
      console.log("Edge-funktion raakavastaus:", response);

      // MUOKATTU KOHTA: tarkista response.data.success eikä response.success
      if (response && response.data && response.data.success) {
        toast({
          title: "DD-tehtävät luotu",
          description: `${response.data.taskCount} uutta tehtävää luotu DD-riskien korjaamiseksi`,
          variant: "default"
        });

        // Pieni viive on edelleen hyvä varmuuden vuoksi (Supabasen replikoinnin takia)
        setTimeout(async () => {
          try {
            // Pakota tehtävien haku tietokannasta ohittamalla välimuisti
            const updatedTasks = await fetchTasks(currentCompanyId, true);
            setTasks(updatedTasks);
            // Vaihda takaisin tehtävät-välilehteen näyttämään uudet tehtävät
            setActiveTab('tehtavat');
            navigate(location.pathname, { replace: true });
          } catch (fetchError) {
            console.error("Error fetching tasks after generation:", fetchError);
          }
        }, 1000); // 1 sekunnin viive
      } else {
        throw new Error((response?.data?.message || response?.error?.message) || "Tehtävien luominen epäonnistui");
      }
    } catch (error) {
      console.error("Error generating DD tasks:", error);
      toast({
        title: "Virhe",
        description: error instanceof Error ? error.message : "Tehtävien generointi epäonnistui",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTasks(false);
    }
  }, [currentCompanyId, valuationImpact, toast, fetchTasks]);

  const handlePostDDAnalyze = useCallback(async (previousAnalysisId: string) => {
    if (!currentCompanyId || !previousAnalysisId) {
      toast({ 
        title: "Virhe", 
        description: "Aiempaa analyysiä ei löydy tai yritystä ei ole valittu." 
      });
      return;
    }

    log("Events", `handlePostDDAnalyze called with previousAnalysisId=${previousAnalysisId}`);
    
    // Näytä toast-ilmoitus
    toast({
      title: "DD-analyysi käynnistetty",
      description: "Due diligence -analyysin laskenta on nyt käynnissä. Tämä voi kestää useita minuutteja.",
      duration: 5000,
    });
    
    // Näytä pysyvä alert analyysin ajaksi
    setAnalysisType('dd');
    setShowAnalysisAlert(true);
    
    setIsDDAnalyzing(true);

    try {
      // Käytä hookin analyzePostDDImpact-funktiota, joka hoitaa pollingin
      // Huomaa että välitämme latestValuationId-parametrin
      const result = await analyzePostDDImpact(currentCompanyId, previousAnalysisId, latestValuationId);

      if (result) {
        // Kun analyysi on valmis, vaihda välilehti
        setActiveTab('arvovaikutus');
        navigate(`${location.pathname}?tab=impact`, { replace: true });
      }
    } catch (error) {
      console.error("Error in post-DD analysis:", error);
      toast({
        title: "Virhe",
        description: error instanceof Error ? error.message : "DD-analyysi epäonnistui",
        variant: "destructive"
      });
    } finally {
      setIsDDAnalyzing(false);
    }
  }, [currentCompanyId, analyzePostDDImpact, latestValuationId, toast, navigate, location.pathname]);

  const handleTaskCreated = useCallback((task: Task) => {
    log("Events", `handleTaskCreated called with taskId=${task.id}`);
    setTasks(prevTasks => [task, ...prevTasks]);
    toast({ 
      title: "Tehtävä luotu", 
      description: `Tehtävä "${task.title}" luotu onnistuneesti.` 
    });
    setIsTaskModalOpen(false);
  }, [toast]);

  const handleAnalyzeClick = useCallback(() => {
    log("Events", "handleAnalyzeClick called");
    if (!currentCompanyId) {
      toast({ 
        title: "Virhe", 
        description: "Valitse ensin yritys." 
      });
      return;
    }
    if (!latestValuationId) {
      toast({ 
        title: "Virhe", 
        description: "Yrityksellä ei ole arvonmääritystä. Luo arvonmääritys ensin." 
      });
      return;
    }
    
    // Näytä toast-ilmoitus
    toast({
      title: "Laskenta käynnistetty",
      description: "Arvovaikutuksen laskenta on nyt käynnissä. Tämä voi kestää useita minuutteja.",
      duration: 5000,
    });
    
    // Näytä pysyvä alert analyysin ajaksi
    setAnalysisType('valuation');
    setShowAnalysisAlert(true);
    
    analyzeValuationImpact(currentCompanyId, latestValuationId);
    // Poistetaan setActiveTab ja navigate täältä
  }, [currentCompanyId, latestValuationId, analyzeValuationImpact, toast]);

  const handleChangeCompany = useCallback(() => {
    log("Events", "handleChangeCompany called");
    setShowCompanySelector(true);
  }, []);

  const handleCompanySelect = useCallback((companyName: string, companyId: string | null) => {
    log("Events", `handleCompanySelect called with name=${companyName}, id=${companyId}`);
    setShowCompanySelector(false);
    if (!companyId) {
      navigate('/profile');
    } else {
      if (currentCompanyId !== companyId) {
        navigate(`/tasks?companyId=${companyId}`);
      }
    }
  }, [navigate, currentCompanyId]);

  const handleToggleCompleted = useCallback(async (taskId: string, isCompletedCurrently: boolean) => {
    log("Events", `handleToggleCompleted called with taskId=${taskId}, isCompleted=${isCompletedCurrently}`);
    try {
      const updatedTask = await updateTaskStatus(taskId, !isCompletedCurrently);
      if (updatedTask) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? updatedTask : task
          )
        );
        toast({ title: isCompletedCurrently ? "Tehtävä merkitty keskeneräiseksi" : "Tehtävä merkitty valmiiksi" });
      }
    } catch (error) {
      console.error("Failed to update task status in component:", error);
    }
  }, [updateTaskStatus, toast]);

  const handleSaveResponse = useCallback(async (taskId: string, responseValue: any) => {
    log("Events", `handleSaveResponse called with taskId=${taskId}`);
    try {
      const updatedTask = await saveTaskResponse(taskId, responseValue);
      if (updatedTask) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? updatedTask : task
          )
        );
        toast({ title: "Vastaus tallennettu" });
      }
    } catch (error) {
      console.error("Failed to save task response in component:", error);
    }
  }, [saveTaskResponse, toast]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    log("Events", `handleDeleteTask called with taskId=${taskId}`);
    try {
      // Päivitä tehtävälista välittömästi UI:ssa paremman käyttökokemuksen saavuttamiseksi
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      const success = await deleteTask(taskId);
      if (success) {
        // Hae tehtävät uudelleen jotta riippuvuudet päivittyvät
        if (currentCompanyId) {
          const updatedTasks = await fetchTasks(currentCompanyId, true); // forceRefresh = true
          setTasks(updatedTasks);
        }
        toast({ title: "Tehtävä poistettu" });
      } else {
        // Jos poisto epäonnistuu, haetaan tehtävät uudelleen
        if (currentCompanyId) {
          const updatedTasks = await fetchTasks(currentCompanyId);
          setTasks(updatedTasks);
        }
        throw new Error("Tehtävän poistaminen epäonnistui palvelimella");
      }
    } catch (error) {
      console.error("Failed to delete task in component:", error);
      toast({ 
        title: "Virhe", 
        description: "Tehtävän poistaminen epäonnistui",
        variant: "destructive" 
      });
    }
  }, [deleteTask, toast, currentCompanyId, fetchTasks]);

  // --- Memoized values ---
  const sortedTasks = useMemo(() => {
    return sortTasksByDependencies(tasks);
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completion_status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const canAnalyze = useMemo(() => {
    return completionRate >= 75;
  }, [completionRate]);

  const isEmpty = useMemo(() => {
    return !tasksLoading && tasks.length === 0;
  }, [tasksLoading, tasks.length]);

  // DD-tehtävien tila
  const hasDDTasks = useMemo(() => {
    return tasks.some(task => task.dd_related === true);
  }, [tasks]);

  const ddTasksCompletionRate = useMemo(() => {
    const ddTasks = tasks.filter(task => task.dd_related === true);
    if (ddTasks.length === 0) return 0;

    const completedDDTasks = ddTasks.filter(t => t.completion_status === 'completed');
    return completedDDTasks.length / ddTasks.length;
  }, [tasks]);

  // --- Effects ---
  
  // Monitor analysis state and hide alert when finished
  useEffect(() => {
    // Jos analyysi on päättynyt, piilota alert
    if (!isAnalyzing && !isDDAnalyzing) {
      setShowAnalysisAlert(false);
    }
  }, [isAnalyzing, isDDAnalyzing]);

  // URL-tab synchronization
  useEffect(() => {
    const tab = searchParams.get('tab');

    if (tab === 'impact' && (hasAnalysis || isAnalyzing || analysisError)) {
      if (activeTab !== 'arvovaikutus') {
        setActiveTab('arvovaikutus');
      }
    } else if (tab && tab !== 'impact') {
      navigate(location.pathname, { replace: true });
      if (activeTab !== 'tehtavat') {
        setActiveTab('tehtavat');
      }
    } else if (!tab) {
      if (activeTab === 'arvovaikutus' && !hasAnalysis && !isAnalyzing && !analysisError) {
        setActiveTab('tehtavat');
      } 
    }
  }, [searchParams, hasAnalysis, isAnalyzing, analysisError, navigate, location.pathname, activeTab]);
  
  // valuationImpact-tilan muutosten seuranta
  useEffect(() => {
    // Tarkistetaan, onko analyysi juuri valmistunut
    const justCompleted = valuationImpact && prevIsAnalyzingRef.current && !isAnalyzing;

    // Päivitetään ref ennen muita operaatioita
    prevIsAnalyzingRef.current = isAnalyzing;

    // Ohjataan käyttäjä vain kun analyysi on juuri valmistunut
    if (justCompleted) {
      setActiveTab('arvovaikutus');
      navigate(`${location.pathname}?tab=impact`, { replace: true });
    }
  }, [valuationImpact, isAnalyzing, navigate, location.pathname]);

  // Data fetching effect - with proper change detection
  useEffect(() => {
    const hasCompanyChanged = currentCompanyId !== prevActiveCompanyId.current;
    const hasDataFetchedChanged = dataFetched !== prevDataFetched.current;

    // Update refs to track changes
    prevActiveCompanyId.current = currentCompanyId || null;
    prevDataFetched.current = !!dataFetched;

    // If company ID or dataFetched haven't changed, don't run the fetch logic again
    if (!hasCompanyChanged && !hasDataFetchedChanged) {
      return;
    }

    // Exit early if we don't have the necessary conditions
    if (!currentCompanyId || !dataFetched) {
      // Only update state if they would actually change from current values
      const shouldResetTasks = tasks.length > 0;
      const shouldResetLoading = tasksLoading;
      const shouldResetError = componentError !== null;

      if (shouldResetTasks || shouldResetLoading || shouldResetError) {
        log("Effect-FetchData", "Conditions not met, resetting state");
        if (shouldResetTasks) setTasks([]);
        if (shouldResetLoading) setTasksLoading(false);
        if (shouldResetError) setComponentError(null);
      }
      return;
    }

    const fetchAllData = async () => {
      log("Effect-FetchData", `Starting data fetch for company ${currentCompanyId}`);
      setTasksLoading(true);
      setComponentError(null);
      try {
        // 1. Fetch tasks
        const taskData = await fetchTasks(currentCompanyId);
        log("Effect-FetchData", `Task data fetched, length: ${taskData?.length || 0}`);

        const validTasks = Array.isArray(taskData) ? taskData.filter(t => t && t.id) : [];
        setTasks(validTasks);

        // 2. Fetch latest analysis
        log("Effect-FetchData", `Fetching latest analysis for ${currentCompanyId}`);
        await fetchLatestAnalysis(currentCompanyId);
        log("Effect-FetchData", "Latest analysis fetched");

        // TÄSSÄ ON MUUTOS: 3. Hae viimeisin arvonmääritys-ID ja aseta se storeen
        try {
          const { data: valuationData, error: valuationError } = await supabase
            .from('valuations')
            .select('id')
            .eq('company_id', currentCompanyId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (!valuationError && valuationData) {
            log("Effect-FetchData", `Found latest valuation ID: ${valuationData.id}`);
            useValuationStore.getState().setLatestValuationId(valuationData.id);
          } else if (valuationError && valuationError.code !== 'PGRST116') {
            console.error("Error fetching valuation:", valuationError);
          }
        } catch (valErr) {
          console.error("Error fetching valuation ID:", valErr);
        }

      } catch (err) {
        log("Effect-FetchData", "Error during data fetching", err);
        console.error("Task Fetch Effect: Error during data fetching:", err);
        setComponentError("Tehtävien tai analyysin lataus epäonnistui.");
        setTasks([]);
      } finally {
        log("Effect-FetchData", "Data fetching finished, setting tasksLoading=false");
        setTasksLoading(false);
      }
    };

    fetchAllData();
  }, [currentCompanyId, dataFetched, fetchTasks, fetchLatestAnalysis, tasks.length, tasksLoading, componentError]);

  // --- Rendering logic ---
  let content;

  // 1. Loading company data or no company
  if (!dataFetched || !currentCompanyId) {
    content = (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
        <p className="ml-4 text-muted-foreground">Ladataan yritystietoja...</p>
      </div>
    );
  }
  // 2. Component error
  else if (componentError) {
    content = (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Virhe</AlertTitle>
        <AlertDescription>{componentError}</AlertDescription>
      </Alert>
    );
  }
  // 3. Loading tasks
  else if (tasksLoading) {
    content = (
      <div className="flex justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary/70" />
        <p className="ml-4 text-muted-foreground">Ladataan tehtäviä...</p>
      </div>
    );
  }
  // 4. No tasks
  else if (isEmpty && currentCompanyId) {
    content = <EmptyTaskView companyName={activeCompany?.name} />;
  }
  // 5. Show tasks and possibly analysis
  else if (tasks.length > 0 && currentCompanyId) {
    content = (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Yhteenveto</CardTitle>
            <CardDescription>Tehtävien edistyminen ja arvioitu vaikutus arvoon.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left section - Progress bars (takes 2/3 of space) */}
              <div className="md:col-span-2">
                <TaskProgressBar tasks={tasks} showDetails={true} size="lg"/>
              </div>
              
              {/* Right section - NextActionGuide (takes 1/3 of space) */}
              <div className="md:col-span-1">
                <NextActionGuide 
                  hasAnalysis={hasAnalysis}
                  hasDDTasks={hasDDTasks}
                  hasTasks={tasks.length > 0}
                  taskCount={tasks.length}
                  completionRate={completionRate}
                  ddTasksCompletionRate={ddTasksCompletionRate}
                  onGenerateDDTasks={handleGenerateDDTasks}
                  onAnalyzeImpact={handleAnalyzeClick}
                  isGeneratingTasks={isGeneratingTasks}
                  isAnalyzing={isAnalyzing || isDDAnalyzing}
                />
                
                {hasAnalysis && valuationImpact && (
                  <div className="mt-4">
                    <ValuationImpactSummary
                      originalValue={valuationImpact.original_valuation_snapshot?.averageValuation}
                      adjustedValue={valuationImpact.adjusted_valuation_result?.averageValuation}
                      hasAnalysis={hasAnalysis}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <AnalysisButton
                isEnabled={canAnalyze}
                completionPercentage={completionRate}
                onAnalyze={handleAnalyzeClick}
                isAnalyzing={isAnalyzing || isDDAnalyzing}
                hasAnalysis={hasAnalysis}
                hasDDTasks={hasDDTasks}
                ddTasksCompletionRate={ddTasksCompletionRate}
                previousAnalysisId={valuationImpact?.id}
                onAnalyzePostDD={handlePostDDAnalyze}
              />
              
              <NewTasksNotification />

              {analysisError && !isAnalyzing && !isDDAnalyzing && !hasAnalysis && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Analyysivirhe</AlertTitle>
                  <AlertDescription>{analysisError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tehtavat">Tehtävät ({tasks.length})</TabsTrigger>
          <TabsTrigger value="arvovaikutus" disabled={!hasAnalysis && !isAnalyzing && !isDDAnalyzing && !analysisError}>
            Arvovaikutus
            {hasAnalysis && <CheckCircle className="h-4 w-4 ml-2 text-green-600"/>}
            {(isAnalyzing || isDDAnalyzing) && <Loader2 className="h-4 w-4 ml-2 animate-spin"/>}
            {analysisError && !isAnalyzing && !isDDAnalyzing && <AlertTriangle className="h-4 w-4 ml-2 text-red-600"/>}
          </TabsTrigger>
        </TabsList>

        {/* Task List Tab */}
        <TabsContent value="tehtavat" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Tehtävälista</CardTitle>
              <div className="flex gap-2">
                {/* Yhtenäinen luontipainike pudotusvalikolla */}
                {currentCompanyId && (
                  <>
                    <TaskCreationDropdown
                      isGeneratingTasks={isGeneratingTasks}
                      onCreateSingleTask={() => setIsTaskModalOpen(true)}
                      onGenerateDDTasks={handleGenerateDDTasks}
                      valuationImpact={valuationImpact}
                      currentCompanyId={currentCompanyId}
                    />
                  </>
                )}

                {latestValuationId && (
                  <Link to={`/valuation?id=${latestValuationId}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Näytä arvonmääritys
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <TaskList
                tasks={sortedTasks}
                allTasks={tasks}
                onComplete={handleToggleCompleted}
                onSaveResponse={handleSaveResponse}
                onDelete={handleDeleteTask}
                showFilters={true}
                showEmptyState={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Tab */}
        <TabsContent value="arvovaikutus">
          <ValuationImpactTab
            valuationImpact={valuationImpact}
            isLoading={isAnalyzing || isDDAnalyzing}
            error={analysisError}
            onGenerateDDTasks={handleGenerateDDTasks} 
            isGeneratingTasks={isGeneratingTasks} 
          />
        </TabsContent>
      </Tabs>
    );
  }
  // 6. Unexpected state
  else {
    content = (
      <div className="flex justify-center py-12">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <p className="ml-4 text-muted-foreground">Odottamaton tila. Yritä päivittää sivu.</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      pageTitle=""
      pageDescription="Seuraa tehtäviä ja niiden vaikutusta yrityksesi arvoon"
      showBackButton={true}
    >
      <CompanySelector
        showCompanySelector={showCompanySelector}
        setShowCompanySelector={setShowCompanySelector}
        previousCompanies={[]} 
        companies={[]} // Simplified - will be populated by the component
        handleCompanySelect={handleCompanySelect}
      />
      
      {/* Pysyvä ilmoitus analyysin aikana */}
      <AnalysisAlert 
        isVisible={showAnalysisAlert} 
        analysisType={analysisType} 
        className="mb-4" 
      />

      {/* Modaali tehtävän luontia varten */}
      {currentCompanyId && (
        <TaskCreationModal
          isOpen={isTaskModalOpen}
          onOpenChange={setIsTaskModalOpen}
          onTaskCreated={handleTaskCreated}
          companyId={currentCompanyId}
          createTask={createTask}
        />
      )}

      {/* Company selector button (väliaikaisesti piilotettu) */}
      {dataFetched && currentCompanyId && (
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-base font-semibold">
              Valittu yritys: {activeCompany?.name || '...'}
            </h3>
          </div>
          {/* Painike väliaikaisesti piilotettu
          <Button
            variant="outline"
            size="sm"
            onClick={handleChangeCompany}
            className="gap-1.5"
          >
            Vaihda yritystä
          </Button>
          */}
        </div>
      )}

      {content}
    </DashboardLayout>
  );
};

export default TaskDashboard;