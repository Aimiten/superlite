// AssessmentContainer.tsx tiedoston korjaus
import React, { useEffect } from "react";
import { useAssessmentStore } from "@/stores/assessmentStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from 'react-router-dom'; // LISÄTTY: Tarvitaan navigointia varten

// Import step components
import InitialSelectionStep from "./steps/InitialSelectionStep";
import ProcessingStep from "./steps/ProcessingStep";
import QuestionsStep from "./steps/QuestionsStep";
// Import the existing results component instead of ResultsStep
import { AssessmentResults } from "./AssessmentResultsContainer";
import ResultsStep from "./steps/ResultsStep"; // LISÄTTY: Tuodaan ResultsStep-komponentti
import { supabase } from "@/integrations/supabase/client";

interface AssessmentContainerProps {
  onAssessmentComplete?: () => void;
  preselectedCompany?: string | null;
  preselectedCompanyId?: string | null;
}

const AssessmentContainer: React.FC<AssessmentContainerProps> = ({
  onAssessmentComplete,
  preselectedCompany,
  preselectedCompanyId
}) => {
  const { toast } = useToast();
  const navigate = useNavigate(); // LISÄTTY: Navigointi-hook tehtävien luomissivulle siirtymistä varten

  // Get required state from the assessment store
  const {
    session,
    sessionStatus,
    sessionError,
    isLoading,
    fetchOrCreateSession,
    getDocumentsFromValuation,
    resetAssessment,
    valuationId,
    // KORJAUS: Haetaan myös questions, jotta voidaan varmistaa, että ne ladataan
    questions
  } = useAssessmentStore();

  // Initialize session when component mounts
  useEffect(() => {
    // Reset store when component unmounts
    return () => resetAssessment();
  }, [resetAssessment]);

  // Effect to create session with preselected company
  useEffect(() => {
    // Estetään turhien useEffect-kutsujen laukaisu
    let isInitializing = false;

    const initSession = async () => {
      // Estetään päällekkäiset kutsut
      if (isInitializing) return;

      // Jos sessio on jo luotu, ei tehdä mitään
      if (session?.id && session.company_id === preselectedCompanyId) {
        console.log(`[AssessmentContainer] Sessio jo olemassa (${session.id}), ei alusteta uudelleen`);
        return;
      }

      if (preselectedCompanyId && preselectedCompany) {
        try {
          isInitializing = true;

          // Tarkistetaan ensin, onko käyttäjä kirjautunut sisään
          const { data: userData } = await supabase.auth.getUser();
          if (!userData?.user) {
            toast({
              title: "Virhe",
              description: "Käyttäjää ei ole kirjautunut sisään. Kirjaudu sisään ennen arvioinnin aloittamista.",
              variant: "destructive"
            });
            isInitializing = false;
            return;
          }

          console.log(`[AssessmentContainer] Alustetaan sessio yritykselle: ${preselectedCompany} (${preselectedCompanyId})`);
          await fetchOrCreateSession(preselectedCompanyId, preselectedCompany);

          // Tarkistetaan session
          if (!session) {
            console.warn("[AssessmentContainer] Sessiota ei luotu");
          } else {
            console.log(`[AssessmentContainer] Sessio luotu: ${session.id}, vaihe: ${session.current_step}`);
          }

          // Tarkistetaan kysymykset
          if (session?.questions && Array.isArray(session.questions) && session.questions.length > 0) {
            console.log(`[AssessmentContainer] Sessiossa on ${session.questions.length} kysymystä`);

            // Tarkistetaan myös store
            if (!questions || questions.length === 0) {
              console.warn("[AssessmentContainer] Storessa ei ole kysymyksiä vaikka sessiossa on");
            } else {
              console.log(`[AssessmentContainer] Storessa on ${questions.length} kysymystä`);
            }
          } else {
            console.log("[AssessmentContainer] Sessiossa ei ole kysymyksiä");
          }

        } catch (error) {
          console.error("[AssessmentContainer] Virhe session alustuksessa:", error);
          toast({
            title: "Virhe",
            description: `Arvioinnin alustus epäonnistui: ${error.message}`,
            variant: "destructive"
          });
        } finally {
          isInitializing = false;
        }
      }
    };

    initSession();

    // Poistetaan session ja questions riippuvuuslistasta, koska ne aiheuttavat uudelleenalustuksia
  }, [preselectedCompanyId, preselectedCompany, fetchOrCreateSession, toast]);

  // Effect to load valuation documents if valuationId is provided in store
  useEffect(() => {
    if (valuationId && session) {
      console.log("Loading documents from valuation:", valuationId);
      getDocumentsFromValuation(valuationId);
    }
  }, [valuationId, session, getDocumentsFromValuation]);

  // Handle loading state
  if (sessionStatus === 'loading' && !session) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Ladataan arviointia...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (sessionError && sessionStatus === 'error') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center p-6 border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Virhe arvioinnin käynnistyksessä</h2>
          <p className="text-red-600 mb-4">{sessionError}</p>
          <button 
            onClick={resetAssessment}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Kokeile uudelleen
          </button>
        </div>
      </div>
    );
  }

  // KORJAUS: Tarkistetaan kysymykset ja lokitetaan niiden tilanne
  if (session?.current_step === 'questions') {
    if (!questions || questions.length === 0) {
      console.warn("[AssessmentContainer] Sessio on questions-tilassa, mutta storessa ei ole kysymyksiä");
      // Varmistetaan että sessiossa on kysymykset
      if (session.questions && Array.isArray(session.questions) && session.questions.length > 0) {
        console.log(`[AssessmentContainer] Sessiossa on ${session.questions.length} kysymystä, mutta ne eivät ole storessa`);
      } else {
        console.warn("[AssessmentContainer] Sessiossa ei ole kysymyksiä vaikka ollaan questions-tilassa");
      }
    } else {
      console.log(`[AssessmentContainer] Questions-tila: store sisältää ${questions.length} kysymystä`);
    }
  }

  // Render current step based on session state
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {!session || session.current_step === 'initial-selection' ? (
        <InitialSelectionStep 
          companyId={session?.company_id || preselectedCompanyId || null}
          onCompanySelect={fetchOrCreateSession}
        />
      ) : session.current_step === 'processing' ? (
        <ProcessingStep 
          stage={session.processing_stage || 'company-info'}
          progress={session.processing_progress || 0}
        />
      ) : session.current_step === 'questions' ? (
        // KORJAUS: Varmistetaan että QuestionsStep komponentilla on pääsy sessioon ja storen kysymyksiin
        <QuestionsStep />
      ) : session.current_step === 'results' ? (
        // MUUTOS: Käytetään ResultsStep-komponenttia tulosten näyttämiseen
        // (AssessmentResults komponenttia käytetään vain jaettaessa näkymää)
        <ResultsStep
          onBack={onAssessmentComplete}
          onComplete={() => {
            // Ohjaa käyttäjä task-generator-sivulle oikeilla parametreilla
            if (session && session.company_id) {
              navigate(`/task-generator?companyId=${session.company_id}&assessmentId=${session.id}`);
            } else {
              // Fallback, jos jostain syystä tietoja ei ole saatavilla
              onAssessmentComplete?.();
            }
          }}
        />
      ) : (
        <div className="text-center text-gray-600">
          <p>Tuntematon tila. Ole hyvä ja aloita arviointi uudelleen.</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentContainer;