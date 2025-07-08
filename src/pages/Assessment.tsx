// src/pages/Assessment.tsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Loader2, PlusCircle } from "lucide-react";
import { useCompany } from "@/hooks/use-company";
import { useAssessmentStore } from "@/stores/assessmentStore";
import { assessmentService } from "@/utils/assessmentService";
import AssessmentContainer from "@/components/assessment/AssessmentContainer";
import AssessmentList from "@/components/assessment/AssessmentList";
import ResultsStep from "@/components/assessment/steps/ResultsStep"; // Muutettu import
import EmptyAssessmentState from "@/components/assessment/EmptyAssessmentState";
import CompanySelector from "@/components/assessment/CompanySelector";

export type SavedAssessment = {
  id: string;
  user_id: string;
  company_name: string;
  company_id?: string;
  results: any;
  created_at: string;
  answers?: Record<string, any>;
  status?: 'draft' | 'processing' | 'completed';
  questions?: any[];
}

const Assessment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id");
  const { companies, activeCompany } = useCompany();

  // Local UI state
  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<SavedAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAssessmentCreation, setShowAssessmentCreation] = useState(false);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [preselectedCompany, setPreselectedCompany] = useState<string | null>(null);
  const [preselectedCompanyId, setPreselectedCompanyId] = useState<string | null>(null);
  const [previousCompanies, setPreviousCompanies] = useState<{name: string}[]>([]);

  // Reset assessment store when component unmounts
  useEffect(() => {
    return () => {
      useAssessmentStore.getState().resetAssessment();
    };
  }, []);

  // Handle direct navigation to assessment details
  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentById(assessmentId);
    } else {
      setSelectedAssessment(null);
    }
  }, [assessmentId]);

  // Load assessments on initial render
  useEffect(() => {
    fetchSavedAssessments();
    fetchPreviousCompanies();
  }, [user]);

  // Fetch single assessment by ID
  const fetchAssessmentById = async (id: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data } = await assessmentService.getCompletedAssessment(id);

      if (data) {
        // Ladataan arvioinnin tiedot storeen
        useAssessmentStore.setState({ 
          results: data.results,
          answers: data.answers || {},
          questions: data.questions || []
        });

        setSelectedAssessment(data as SavedAssessment);
      } else {
        toast({
          title: "Virhe",
          description: "Arviointia ei löytynyt.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error fetching assessment by ID:", error);
      toast({
        title: "Virhe",
        description: "Arvioinnin hakeminen epäonnistui.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all assessments for the user
  const fetchSavedAssessments = async () => {
    if (!user) return;

    try {
      setIsRefreshing(true);
      console.log("Haetaan arviointeja käyttäjälle:", user.id);
      const { data, error } = await assessmentService.getCompletedAssessments();

      if (error) {
        console.error("Arvioinnin hakuvirhe:", error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log(`Löydettiin ${data.length} arviointia:`, data);
        setSavedAssessments(data as SavedAssessment[]);
      } else {
        console.log("Ei löytynyt aiempia arviointeja");
        setSelectedAssessment(null);
      }
    } catch (error: any) {
      console.error('Error fetching saved assessments:', error);
      toast({
        title: "Virhe",
        description: "Arviointien hakeminen epäonnistui.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Get list of company names user has used before
  const fetchPreviousCompanies = async () => {
    if (!user) return;

    try {
      const { data } = await assessmentService.getPreviousCompanies();
      setPreviousCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching previous companies:', error);
    }
  };

  // Start a new assessment
  const handleStartNewAssessment = async () => {
    if (!user) return;

    try {
      // Hae viimeisin valuationId käyttäjälle (ja mahdollisesti aktiiviselle yritykselle)
      const { valuationId, error } = await assessmentService.getLatestValuationId(
        user.id, 
        activeCompany?.id
      );

      if (error) {
        console.warn("Error fetching latest valuation:", error);
      }

      // Tallenna valuationId storeen, jos saatavilla
      if (valuationId) {
        useAssessmentStore.setState({ valuationId });
        console.log("Using valuation ID:", valuationId);
      }

      // Käytä suoraan aktiivista yritystä jos sellainen on asetettu
      if (activeCompany) {
        setPreselectedCompany(activeCompany.name);
        setPreselectedCompanyId(activeCompany.id);
        setShowAssessmentCreation(true);
      } 
      // Muuten näytä valintadialogi, jos aiempia yrityksiä on
      else if (previousCompanies.length > 0) {
        setShowCompanySelector(true);
      } else {
        setShowAssessmentCreation(true);
      }
    } catch (error) {
      console.error("Error starting assessment:", error);

      // Sama logiikka virheen sattuessa
      if (activeCompany) {
        setPreselectedCompany(activeCompany.name);
        setPreselectedCompanyId(activeCompany.id);
        setShowAssessmentCreation(true);
      } else if (previousCompanies.length > 0) {
        setShowCompanySelector(true);
      } else {
        setShowAssessmentCreation(true);
      }
    }
  };

  // Handle selecting an assessment from the list
  const handleSelectAssessment = (assessment: SavedAssessment) => {
    setSelectedAssessment(assessment);
    navigate(`/assessment?id=${assessment.id}`, { replace: true });
  };

  // Handle going back to list view
  const handleBackToList = () => {
    setSelectedAssessment(null);
    navigate('/assessment', { replace: true });
  };

  // Handle selecting a company
  const handleCompanySelect = (companyName: string, companyId: string | null) => {
    setShowCompanySelector(false);
    setPreselectedCompany(companyName);
    setPreselectedCompanyId(companyId);
    setShowAssessmentCreation(true);
  };

  // Handle assessment completion
  const handleAssessmentComplete = async () => {
    setShowAssessmentCreation(false);
    await fetchSavedAssessments();
  };

  // If showing the assessment creation flow
  if (showAssessmentCreation) {
    return (
      <AssessmentContainer 
        onAssessmentComplete={handleAssessmentComplete} 
        preselectedCompany={preselectedCompany}
        preselectedCompanyId={preselectedCompanyId}
      />
    );
  }

  // Main view
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Myyntikuntoisuuden arviointi</h1>
            <p className="text-muted-foreground mt-1">Arvioi ja seuraa yrityksesi myyntikuntoisuutta</p>
          </div>
          <div>
            <Button 
              onClick={handleStartNewAssessment} 
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
            >
              <PlusCircle className="h-4 w-4 text-white" />
              Uusi arviointi
            </Button>
          </div>
        </div>

        {/* Näytetään joko arvioinnin tulokset tai listanäkymä, ei molempia tab-rakenteessa */}
        {selectedAssessment ? (
          <ResultsStep 
            onBack={handleBackToList}  // Lisätty onBack-callback takaisin-toiminnolle
            onComplete={() => {
              // Navigate to task generator
              if (selectedAssessment && selectedAssessment.company_id) {
                navigate(`/task-generator?companyId=${selectedAssessment.company_id}&assessmentId=${selectedAssessment.id}`);
              } else {
                handleBackToList();
              }
            }}
          />
        ) : (
          <>
            {isLoading ? (
              <div className="flex justify-center my-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : savedAssessments.length === 0 ? (
              <EmptyAssessmentState 
                handleStartNewAssessment={handleStartNewAssessment} 
                hasActiveCompany={!!activeCompany}
              />
            ) : (
              <AssessmentList
                savedAssessments={savedAssessments}
                isLoading={isLoading}
                isRefreshingAssessments={isRefreshing}
                handleSelectAssessment={handleSelectAssessment}
                handleStartNewAssessment={handleStartNewAssessment}
                fetchSavedAssessments={fetchSavedAssessments}
              />
            )}
          </>
        )}

        <CompanySelector
          showCompanySelector={showCompanySelector}
          setShowCompanySelector={setShowCompanySelector}
          previousCompanies={previousCompanies}
          companies={companies}
          handleCompanySelect={handleCompanySelect}
        />
      </div>
    </DashboardLayout>
  );
};

export default Assessment;