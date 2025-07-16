import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SimplePageTransition from '@/components/SimplePageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  FileText,
  BarChart3,
  DollarSign,
  History,
  Plus,
  Info,
  Globe,
  Database
} from 'lucide-react';
import { callEdgeFunction } from '@/utils/edge-function';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useCompany } from '@/hooks/use-company';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  DCFScenarioAnalysis as DCFAnalysisType, 
  DCFStructuredData,
  DCFAnalysisRequest,
  DCFAnalysisResponse 
} from '@/types/dcf-analysis';
import { DCFExplanationCard } from '@/components/dcf/DCFExplanationCard';
import { DCFProgressCard } from '@/components/dcf/DCFProgressCard';
import { DCFEmptyState } from '@/components/dcf/DCFEmptyState';
import { DCFAnalysisResults } from '@/components/dcf/DCFAnalysisResults';
import { DCFHistoryList } from '@/components/dcf/DCFHistoryList';

interface DCFHistoryItem {
  id: string;
  created_at: string;
  status: string;
  structured_data: DCFStructuredData | null;
  company_name: string;
}

const DCFAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCompany, loading: companyLoading } = useCompany();
  
  const [analysis, setAnalysis] = useState<Pick<DCFAnalysisType, 'id' | 'structured_data' | 'created_at'> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [dcfHistory, setDcfHistory] = useState<DCFHistoryItem[]>([]);
  const [latestValuation, setLatestValuation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer for elapsed time during analysis
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnalyzing) {
      setElapsedTime(0);
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAnalyzing]);

  // Load data on component mount
  useEffect(() => {
    if (activeCompany?.id) {
      loadLatestValuation();
      loadDCFHistory();
    }
  }, [activeCompany?.id]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  const loadLatestValuation = async () => {
    if (!activeCompany?.id) return;

    try {
      const { data: valuations, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (valuations && valuations.length > 0) {
        setLatestValuation(valuations[0]);
      }
    } catch (error) {
      console.error('Error loading latest valuation:', error);
    }
  };

  const loadDCFHistory = async () => {
    if (!activeCompany?.id) return;

    try {
      const { data: analyses, error } = await supabase
        .from('dcf_scenario_analyses')
        .select('id, created_at, status, structured_data')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const historyItems: DCFHistoryItem[] = (analyses || [])
        .filter(analysis => analysis && analysis.id) // Filter out null/undefined items
        .map(analysis => ({
          id: analysis.id,
          created_at: analysis.created_at,
          status: analysis.status,
          structured_data: analysis.structured_data ? analysis.structured_data as DCFStructuredData : null,
          company_name: activeCompany.name
        }));

      setDcfHistory(historyItems);

      // If we have a recent completed analysis, show it
      const latestCompleted = historyItems.find(item => 
        item && 
        item.status === 'completed' && 
        item.structured_data &&
        item.structured_data.valuation_summary
      );
      
      if (latestCompleted && latestCompleted.structured_data) {
        setAnalysis({
          id: latestCompleted.id,
          structured_data: latestCompleted.structured_data,
          created_at: latestCompleted.created_at
        });
      }

    } catch (error) {
      console.error('Error loading DCF history:', error);
    }
  };

  /**
   * Polls for DCF analysis completion using setInterval pattern
   * Same pattern as Valuation.tsx for consistency
   */
  const pollForDCFCompletion = useCallback((
    companyId: string,
    valuationId: string,
    maxRetries: number = 60,
    intervalMs: number = 10000
  ) => {
    let attempts = 0;
    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`[DCF] Polling for analysis completion (attempt ${attempts}/${maxRetries})`);

      try {
        // Query the latest DCF analysis for this company and valuation
        const { data, error } = await supabase
          .from('dcf_scenario_analyses')
          .select('*')
          .eq('company_id', companyId)
          .eq('valuation_id', valuationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn("[DCF] Error during polling:", error);
          // Continue polling despite error
        } else if (data) {
          // Update progress messages during processing - Orchestrator phases
          if (data.status === 'processing') {
            const progressMessages = [
              'Analysoidaan yritystietoja ja valitaan DCF-metodi...',
              'Claude Orchestrator valitsee sopivimman lähestymistavan...',
              'Ladataan markkinatietoja (ECB, Eurostat, Damodaran)...',
              'Claude Opus analysoi tilinpäätöksiä perusteellisesti...',
              'Strukturoidaan tulokset ja validoidaan laskelmat...',
              'Viimeistellään analyysia ja luotettavuusarvioita...'
            ];
            const messageIndex = Math.min(Math.floor(attempts / 2), progressMessages.length - 1);
            setAnalysisProgress(progressMessages[messageIndex]);
          } else if (data.status === 'completed' && data.structured_data) {
            console.log("[DCF] Analysis completed successfully");
            clearInterval(pollInterval);
            setIsPolling(false);
            
            // Set the completed analysis
            setAnalysis({
              id: data.id,
              structured_data: data.structured_data,
              created_at: data.created_at
            });
            
            // Reload history and stop analysis state
            await loadDCFHistory();
            setIsAnalyzing(false);
            setAnalysisProgress('');
            
            toast({
              title: "DCF-analyysi valmis!",
              description: "Skenaarioanalyysi on suoritettu onnistuneesti"
            });
            
            setActiveTab('current');
          } else if (data.status === 'failed') {
            console.error("[DCF] Analysis failed:", data.error_message);
            clearInterval(pollInterval);
            setIsPolling(false);
            setIsAnalyzing(false);
            setAnalysisProgress('');
            
            toast({
              title: "DCF-analyysi epäonnistui",
              description: data.error_message || "Analyysi epäonnistui, yritä uudelleen",
              variant: "destructive"
            });
          }
        }

        // Check if we've exceeded max attempts
        if (attempts >= maxRetries) {
          console.warn("[DCF] Analysis polling timed out after maximum attempts");
          clearInterval(pollInterval);
          setIsPolling(false);
          setIsAnalyzing(false);
          setAnalysisProgress('');
          
          toast({
            title: "DCF-analyysi kesti liian kauan",
            description: "Analyysi saattaa vielä valmistua, tarkista myöhemmin",
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("[DCF] Error during poll:", err);
        // Continue polling despite error
      }
    }, intervalMs);

    // Store interval ID for cleanup if needed
    return pollInterval;
  }, [loadDCFHistory]);


  const runDCFAnalysis = async () => {
    if (!latestValuation?.id || !activeCompany?.id) {
      toast({
        title: "Virhe",
        description: "Tarvitset ensin valmiin arvonmäärityksen DCF-analyysiä varten",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setElapsedTime(0);
    setAnalysisProgress('Aloitetaan DCF-analyysi...');

    try {
      console.log('DCF Analysis - latestValuation:', latestValuation);
      console.log('DCF Analysis - activeCompany:', activeCompany);
      
      const requestData: DCFAnalysisRequest = {
        valuationId: latestValuation.id,
        companyId: activeCompany.id,
        userId: user?.id || ''
      };
      
      console.log('DCF Analysis - requestData:', requestData);

      setAnalysisProgress('Lisätään analyysi käsittelyjonoon...');
      
      // Käytä jonoa DCF-analyysin käynnistämiseen
      const { data, error } = await callEdgeFunction<{ success: boolean; message: string; status: string; analysis_id?: string }>('queue-dcf-analysis', requestData);

      if (error) {
        throw error;
      }

      if (data) {
        if (data.status === 'completed' && data.analysis_id) {
          // Analyysi on jo valmis, lataa se
          await loadDCFHistory();
          toast({
            title: "DCF-analyysi valmis!",
            description: "Analyysi oli jo valmiina"
          });
          setActiveTab('current');
        } else if (data.status === 'processing') {
          // Analyysi on jo käynnissä
          toast({
            title: "DCF-analyysi käynnissä",
            description: "Analyysi on jo prosessoinnissa, odota hetki..."
          });
          // Käynnistä pollaus tarkistamaan tilaa
          const intervalId = pollForDCFCompletion(activeCompany.id, latestValuation.id);
          pollIntervalRef.current = intervalId;
        } else if (data.status === 'queued') {
          // Analyysi lisätty jonoon
          toast({
            title: "DCF-analyysi aloitettu",
            description: "Analyysi on lisätty käsittelyjonoon"
          });
          // Päivitä progress-viesti ja käynnistä pollaus
          setAnalysisProgress('Analyysi jonossa, odotetaan käsittelijää...');
          const intervalId = pollForDCFCompletion(activeCompany.id, latestValuation.id);
          pollIntervalRef.current = intervalId;
        } else {
          throw new Error('DCF-analyysi epäonnistui');
        }
      } else {
        throw new Error('DCF-analyysi epäonnistui');
      }
    } catch (error: any) {
      console.error('DCF analysis error:', error);
      setIsAnalyzing(false);
      setAnalysisProgress('');
      setElapsedTime(0);
      setIsPolling(false);
      
      toast({
        title: "DCF-analyysi epäonnistui",
        description: error.message || "Tuntematon virhe analyysissä",
        variant: "destructive"
      });
    }
  };


  const renderHistoryItem = (item: DCFHistoryItem) => (
    <Card key={item.id} className="cursor-pointer hover:shadow-neumorphic transition-shadow shadow-neumorphic"
          onClick={() => {
            if (item.structured_data) {
              setAnalysis({
                id: item.id,
                structured_data: item.structured_data,
                created_at: item.created_at
              });
              setActiveTab('current');
            }
          }}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-sm">
              DCF-analyysi
            </div>
            <div className="text-xs text-slate-600">
              {new Date(item.created_at).toLocaleDateString('fi-FI')} {new Date(item.created_at).toLocaleTimeString('fi-FI')}
            </div>
            {item.structured_data?.valuation_summary?.probability_weighted_valuation && (
              <div className="text-sm font-medium mt-2">
                {formatCurrency(item.structured_data.valuation_summary.probability_weighted_valuation.weighted_equity_value)}
              </div>
            )}
          </div>
          <Badge variant={
            item.status === 'completed' ? 'default' : 
            item.status === 'phase1_completed' ? 'secondary' :
            item.status === 'processing' ? 'outline' :
            'destructive'
          }>
            {item.status === 'phase1_completed' ? 'Vaihe 1 valmis' : item.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while companies are being loaded
  if (companyLoading) {
    return (
      <DashboardLayout>
        <SimplePageTransition>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Ladataan tietoja...</p>
              </div>
            </div>
          </div>
        </SimplePageTransition>
      </DashboardLayout>
    );
  }

  if (!activeCompany) {
    return (
      <DashboardLayout>
        <SimplePageTransition>
          <div className="container mx-auto px-4 py-8">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Valitse ensin yritys yläpalkista DCF-analyysiä varten.
              </AlertDescription>
            </Alert>
          </div>
        </SimplePageTransition>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SimplePageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">DCF Skenaarioanalyysi</h1>
              <p className="text-slate-600">
                Discounted Cash Flow -analyysi yritykselle {activeCompany.name}
              </p>
            </div>
            <Button 
              onClick={runDCFAnalysis}
              disabled={isAnalyzing || !latestValuation}
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analysoidaan...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Uusi DCF-analyysi
                </>
              )}
            </Button>
          </div>

          <DCFExplanationCard />

          {!latestValuation && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                DCF-analyysi vaatii valmiin arvonmäärityksen tilinpäätöstietojen saamiseksi. 
                <Button variant="link" className="p-0 h-auto ml-1" onClick={() => navigate('/valuation')}>
                  Luo arvonmääritys ensin →
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isAnalyzing && (
            <DCFProgressCard 
              analysisProgress={analysisProgress}
              elapsedTime={elapsedTime}
            />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Viimeisin analyysi
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historia ({dcfHistory.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current">
              {analysis?.structured_data ? (
                <DCFAnalysisResults analysisData={analysis.structured_data} />
              ) : (
                <DCFEmptyState 
                  onStartAnalysis={runDCFAnalysis}
                  isAnalyzing={isAnalyzing}
                  hasValuation={!!latestValuation}
                />
              )}
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {dcfHistory && dcfHistory.length > 0 ? (
                  dcfHistory.filter(item => item && item.id).map(renderHistoryItem)
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <History className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <h3 className="text-lg font-semibold mb-2">Ei aiempia analyysejä</h3>
                      <p className="text-slate-600">
                        DCF-analyysit näkyvät täällä kun niitä on luotu
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SimplePageTransition>
    </DashboardLayout>
  );
};

export default DCFAnalysis;