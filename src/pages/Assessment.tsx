import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import AssessmentContainer from "@/components/assessment/AssessmentContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AssessmentResults } from "@/components/AssessmentResults";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { usePersistentStorage } from "@/hooks/use-persistent-storage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AssessmentEmergencyReset from "@/components/assessment/AssessmentEmergencyReset";
import AssessmentErrorState from "@/components/assessment/AssessmentErrorState";
import AssessmentList from "@/components/assessment/AssessmentList";
import CompanySelector from "@/components/assessment/CompanySelector";
import { RefreshCcw, Loader2 } from "lucide-react";

type SavedAssessment = {
  id: string;
  user_id: string;
  company_name: string;
  results: any;
  created_at: string;
  answers?: Record<string, any>;
}

type CompanyName = {
  name: string;
}

const RECOVERY_MODE_KEY = 'assessment-recovery-mode';
const MAX_RESET_ATTEMPTS = 3;
const RESET_ATTEMPTS_KEY = 'assessment-reset-attempts';

const Assessment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id");
  
  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<SavedAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [previousCompanies, setPreviousCompanies] = useState<CompanyName[]>([]);
  const [preselectedCompany, setPreselectedCompany] = useState<string | null>(null);
  const [activeAssessment, setActiveAssessment] = usePersistentStorage<boolean>(
    'active-assessment-session',
    false,
    { debug: true }
  );
  const [isSessionRecovering, setIsSessionRecovering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [inRecoveryMode, setInRecoveryMode] = useState<boolean>(false);
  const [resetAttempts, setResetAttempts] = useState<number>(0);
  const [showEmergencyReset, setShowEmergencyReset] = useState<boolean>(false);
  const [isEmergencyResetting, setIsEmergencyResetting] = useState<boolean>(false);
  const [isRefreshingAssessments, setIsRefreshingAssessments] = useState(false);
  
  const [activeTab, setActiveTab] = useState<string>("list");

  useEffect(() => {
    if (assessmentId) {
      console.log("[Assessment] Direct navigation to assessment with ID:", assessmentId);
      fetchAssessmentById(assessmentId);
      setActiveTab("detail");
    } else {
      setActiveTab("list");
      setSelectedAssessment(null);
    }
  }, [assessmentId]);

  const fetchAssessmentById = async (id: string) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (error) throw error;
      
      if (data) {
        console.log("[Assessment] Fetched specific assessment:", data.id);
        setSelectedAssessment(data as SavedAssessment);
        setActiveTab("detail");
      } else {
        toast({
          title: "Virhe",
          description: "Arviointia ei löytynyt.",
          variant: "destructive"
        });
        setActiveTab("list");
      }
    } catch (error: any) {
      console.error("[Assessment] Error fetching assessment by ID:", error);
      toast({
        title: "Virhe",
        description: "Arvioinnin hakeminen epäonnistui.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const recoveryMode = localStorage.getItem(RECOVERY_MODE_KEY);
      if (recoveryMode === 'true') {
        console.log("[Assessment] Recovery mode is active");
        setInRecoveryMode(true);
      }
      
      const attemptsStr = localStorage.getItem(RESET_ATTEMPTS_KEY);
      if (attemptsStr) {
        const attempts = parseInt(attemptsStr, 10);
        setResetAttempts(attempts);
        
        if (attempts >= MAX_RESET_ATTEMPTS) {
          console.log("[Assessment] Too many reset attempts, showing emergency reset");
          setShowEmergencyReset(true);
        }
      }
    } catch (error) {
      console.error("[Assessment] Error checking recovery state:", error);
    }
  }, []);

  useEffect(() => {
    console.log("[Assessment] Component mounted");
    
    const checkActiveAssessment = () => {
      try {
        const step = localStorage.getItem('assessment-step');
        console.log("[Assessment] Current step:", step);
        
        if (step && step !== '"initial-selection"') {
          console.log("[Assessment] Active assessment session detected", step);
          setActiveAssessment(true);
          setShowNewAssessment(true);
        } else {
          console.log("[Assessment] No active assessment session");
          setActiveAssessment(false);
        }
      } catch (error) {
        console.error("[Assessment] Error checking active assessment:", error);
        setActiveAssessment(false);
      }
    };
    
    checkActiveAssessment();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkActiveAssessment();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const handleError = () => {
      console.log("[Assessment] Global error detected, setting error state");
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('error', handleError);
    };
  }, [setActiveAssessment]);

  useEffect(() => {
    if (inRecoveryMode) {
      console.log("[Assessment] In recovery mode, resetting state");
      setShowNewAssessment(false);
      setActiveAssessment(false);
      setHasError(false);
      
      localStorage.removeItem(RECOVERY_MODE_KEY);
      setInRecoveryMode(false);
      
      toast({
        title: "Palautustila",
        description: "Arviointi on nollattu palautustilassa. Voit aloittaa uuden arvioinnin.",
      });
    }
  }, [inRecoveryMode, toast, setActiveAssessment]);

  const fetchSavedAssessments = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setLoadError(null);
      setIsRefreshingAssessments(true);
      
      console.log("[Assessment] Fetching saved assessments for user:", user.id);
      
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("[Assessment] Fetched assessments:", data?.length || 0);
      
      if (data && data.length > 0) {
        setSavedAssessments(data as SavedAssessment[]);
      } else {
        console.log("[Assessment] No assessments found for user");
        setSelectedAssessment(null);
      }
    } catch (error: any) {
      console.error('[Assessment] Error fetching saved assessments:', error);
      setLoadError("Arviointien hakeminen epäonnistui.");
      toast({
        title: "Virhe",
        description: "Arviointien hakeminen epäonnistui.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshingAssessments(false);
    }
  };

  const fetchPreviousCompanies = async () => {
    if (!user) return;

    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('company_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assessmentError) {
        throw assessmentError;
      }

      let valuationCompanies: { company_name: string }[] = [];
      let tableExists = true;
      
      try {
        const { data, error } = await supabase
          .from('valuations')
          .select('*')
          .limit(1);
          
        if (error) {
          console.log('Valuations table might not exist yet:', error);
          tableExists = false;
        }
      } catch (err) {
        console.log('Error checking valuations table:', err);
        tableExists = false;
      }
      
      if (tableExists) {
        const { data: valuationData, error: valuationError } = await supabase
          .from('valuations')
          .select('company_name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!valuationError) {
          valuationCompanies = valuationData || [];
        }
      }
      
      const assessmentCompanies = assessmentData || [];
      
      const uniqueCompanies = new Set([
        ...valuationCompanies.map(item => item.company_name),
        ...assessmentCompanies.map(item => item.company_name)
      ].filter(Boolean));

      setPreviousCompanies(Array.from(uniqueCompanies).map(name => ({ name })));
    } catch (error: any) {
      console.error('Error fetching previous companies:', error);
    }
  };

  useEffect(() => {
    fetchSavedAssessments();
    fetchPreviousCompanies();
  }, [user]);

  const handleStartNewAssessment = () => {
    console.log("[Assessment] Starting new assessment");
    if (previousCompanies.length > 0) {
      setShowCompanySelector(true);
    } else {
      setActiveTab("create");
      setShowNewAssessment(true);
      setActiveAssessment(true);
    }
  };

  const handleSelectAssessment = (assessment: SavedAssessment) => {
    console.log("[Assessment] Selected assessment:", assessment.id);
    setSelectedAssessment(assessment);
    setActiveTab("detail");
    navigate(`/assessment?id=${assessment.id}`, { replace: true });
  };

  const handleBackToList = () => {
    setActiveTab("list");
    setSelectedAssessment(null);
    navigate('/assessment', { replace: true });
  };

  const handleCompanySelect = (companyName: string | null) => {
    console.log("[Assessment] Selected company:", companyName);
    setShowCompanySelector(false);
    setPreselectedCompany(companyName);
    setActiveTab("create");
    setShowNewAssessment(true);
    setActiveAssessment(true);
  };

  const handleAssessmentComplete = async () => {
    console.log("[Assessment] Assessment completed");
    setShowNewAssessment(false);
    setActiveAssessment(false);
    setHasError(false);
    
    localStorage.removeItem(RESET_ATTEMPTS_KEY);
    setResetAttempts(0);
    
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("[Assessment] Refreshed assessments after completion:", data?.length || 0);
      if (data) {
        setSavedAssessments(data as SavedAssessment[]);
        setActiveTab("list");
      }
    } catch (error) {
      console.error('[Assessment] Error refreshing assessments:', error);
    }
  };

  const handleResetAssessment = () => {
    console.log("[Assessment] Manually resetting assessment session");
    setIsSessionRecovering(true);
    
    const currentAttempts = resetAttempts + 1;
    setResetAttempts(currentAttempts);
    localStorage.setItem(RESET_ATTEMPTS_KEY, currentAttempts.toString());
    
    try {
      localStorage.removeItem("assessment-step");
      localStorage.removeItem("assessment-processing-stage");
      localStorage.removeItem("assessment-processing-progress");
      localStorage.removeItem("assessment-company-name");
      localStorage.removeItem("assessment-company-info");
      localStorage.removeItem("assessment-company-id");
      localStorage.removeItem("assessment-structured-company-data");
      localStorage.removeItem("assessment-readiness-for-sale-data");
      localStorage.removeItem("assessment-selected-documents");
      localStorage.removeItem("assessment-current-question-index");
      localStorage.removeItem("assessment-questions");
      localStorage.removeItem("assessment-answers");
      localStorage.removeItem("assessment-analysis-results");
      localStorage.removeItem("assessment-processing-start-time");
      localStorage.removeItem("active-assessment-session");
      
      setActiveAssessment(false);
      setShowNewAssessment(false);
      setHasError(false);
      
      if (currentAttempts >= MAX_RESET_ATTEMPTS) {
        setShowEmergencyReset(true);
        toast({
          title: "Liian monta nollausyritystä",
          description: "Käytä hätänollausta ongelman ratkaisemiseksi.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Arviointi nollattu",
          description: "Myyntikuntoisuusarviointi nollattu onnistuneesti."
        });
      }
      
      localStorage.setItem(RECOVERY_MODE_KEY, 'true');
      
      navigate('/dashboard');
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("[Assessment] Error resetting assessment:", error);
      setIsSessionRecovering(false);
      toast({
        title: "Virhe",
        description: "Arvioinnin nollaaminen epäonnistui. Ole hyvä ja yritä uudelleen.",
        variant: "destructive"
      });
    }
  };

  const emergencyReset = () => {
    setIsEmergencyResetting(true);
    
    try {
      console.log("[Assessment] EMERGENCY RESET - Clearing all localStorage");
      
      localStorage.clear();
      
      setActiveAssessment(false);
      setShowNewAssessment(false);
      setHasError(false);
      setShowEmergencyReset(false);
      setResetAttempts(0);
      
      toast({
        title: "Täydellinen nollaus suoritettu",
        description: "Kaikki tilatiedot poistettu. Sivu latautuu uudelleen.",
      });
      
      navigate('/dashboard');
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error) {
      console.error("[Assessment] Error in emergency reset:", error);
      setIsEmergencyResetting(false);
      toast({
        title: "Kriittinen virhe",
        description: "Nollaus epäonnistui. Tyhjennä selaushistoria manuaalisesti.",
        variant: "destructive"
      });
    }
  };

  if (showEmergencyReset) {
    return (
      <DashboardLayout pageTitle="Myyntikuntoisuus - Hätänollaus">
        <AssessmentEmergencyReset 
          isEmergencyResetting={isEmergencyResetting}
          emergencyReset={emergencyReset}
        />
      </DashboardLayout>
    );
  }

  if (hasError) {
    return (
      <DashboardLayout pageTitle="Myyntikuntoisuus">
        <AssessmentErrorState 
          handleResetAssessment={handleResetAssessment}
          isSessionRecovering={isSessionRecovering}
        />
      </DashboardLayout>
    );
  }

  if (showNewAssessment || activeAssessment) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleResetAssessment}
            disabled={isSessionRecovering}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCcw className="h-3 w-3" />
            {isSessionRecovering ? "Nollataan..." : "Nollaa istunto"}
          </Button>
        </div>
        <AssessmentContainer 
          onAssessmentComplete={handleAssessmentComplete} 
          preselectedCompany={preselectedCompany}
        />
      </>
    );
  }

  return (
    <DashboardLayout 
      pageTitle="Myyntikuntoisuus" 
      pageDescription="Arvioi ja seuraa yrityksesi myyntikuntoisuutta"
    >
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Myyntikuntoisuuden arviointi</h1>
          <div className="flex gap-2">
            <Button
              variant="outline" 
              onClick={() => fetchSavedAssessments()}
              disabled={isRefreshingAssessments}
              className="flex items-center gap-2"
            >
              {isRefreshingAssessments ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Päivitä
            </Button>
            <Button
              variant="outline"
              onClick={handleResetAssessment}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Nollaa arviointi
            </Button>
          </div>
        </div>

        {loadError ? (
          <div className="text-center p-8 my-12">
            <h2 className="text-xl font-semibold text-red-600 mb-4">{loadError}</h2>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="mx-auto"
            >
              Yritä uudelleen
            </Button>
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="list">Arvioinnit</TabsTrigger>
              {selectedAssessment && <TabsTrigger value="detail">Arvioinnin tulokset</TabsTrigger>}
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              <AssessmentList
                savedAssessments={savedAssessments}
                isLoading={isLoading}
                isRefreshingAssessments={isRefreshingAssessments}
                handleSelectAssessment={handleSelectAssessment}
                handleStartNewAssessment={handleStartNewAssessment}
                fetchSavedAssessments={fetchSavedAssessments}
              />
            </TabsContent>

            <TabsContent value="detail">
              {selectedAssessment && (
                <AssessmentResults 
                  analysisResults={selectedAssessment.results} 
                  answers={selectedAssessment?.answers || {}}
                  onBack={() => {
                    console.log("[Assessment] TabsContent: Switching back to list tab");
                    setActiveTab("list");
                  }}
                />
              )}
            </TabsContent>

            <CompanySelector
              showCompanySelector={showCompanySelector}
              setShowCompanySelector={setShowCompanySelector}
              previousCompanies={previousCompanies}
              handleCompanySelect={handleCompanySelect}
            />
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Assessment;
