import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, Brain, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { callEdgeFunction } from '@/utils/edge-function';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useCompany } from '@/hooks/use-company';
import { 
  DCFScenarioAnalysis as DCFAnalysisType, 
  DCFStructuredData,
  DCFAnalysisRequest,
  DCFAnalysisResponse 
} from '@/types/dcf-analysis';
import { supabase } from '@/integrations/supabase/client';

interface DCFScenarioAnalysisProps {
  latestValuation: any;
}

export const DCFScenarioAnalysis: React.FC<DCFScenarioAnalysisProps> = ({ latestValuation }) => {
  const { activeCompany } = useCompany();
  const [analysis, setAnalysis] = useState<DCFAnalysisType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>('');

  // Load existing analysis on component mount
  useEffect(() => {
    if (latestValuation?.id && activeCompany?.id) {
      loadExistingAnalysis();
    }
  }, [latestValuation?.id, activeCompany?.id]);

  const loadExistingAnalysis = async () => {
    try {
      // TODO: Create get-dcf-analysis function to fetch existing analysis
      // For now, we'll skip this and let user create new analysis
      console.log('Existing analysis loading not yet implemented');
    } catch (error) {
      console.error('Error loading existing analysis:', error);
    }
  };

  const pollForDCFCompletion = async (companyId: string, valuationId: string, maxRetries = 60, intervalMs = 10000) => {
    let retries = 0;

    while (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));

      try {
        const { data, error } = await supabase
          .from('dcf_scenario_analyses')
          .select('*')
          .eq('company_id', companyId)
          .eq('valuation_id', valuationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn("Error during DCF polling:", error);
        } else if (data) {
          if (data.status === 'completed') {
            return data;
          } else if (data.status === 'failed') {
            throw new Error(data.error_message || "DCF-analyysi epäonnistui");
          }
        }
      } catch (err) {
        console.error("DCF polling error:", err);
      }

      retries++;
      setAnalysisProgress(`Analysoidaan... (${Math.floor(retries * intervalMs / 1000)}s)`);
    }

    throw new Error("DCF-analyysi aikakatkaistu");
  };

  const runDCFAnalysis = async () => {
    if (!latestValuation?.id || !activeCompany?.id) {
      toast({
        title: "Virhe",
        description: "Puuttuvat tiedot analyysiä varten",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress('Lisätään analyysi jonoon...');

    try {
      // Queue the analysis
      const request: DCFAnalysisRequest = {
        valuationId: latestValuation.id,
        companyId: activeCompany.id
      };

      const response = await callEdgeFunction('queue-dcf-analysis', request);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        setAnalysisProgress('Claude analysoi tilinpäätöksiä...');
        
        // Poll for completion
        const completedAnalysis = await pollForDCFCompletion(
          activeCompany.id,
          latestValuation.id
        );

        setAnalysis(completedAnalysis);
        setAnalysisProgress('');
        toast({
          title: "DCF-analyysi valmis",
          description: "Claude Sonnet on analysoinut tilinpäätökset ja laskenut skenaariot"
        });
      } else {
        throw new Error(response.data?.message || 'Tuntematon virhe');
      }
    } catch (error: any) {
      console.error('DCF analysis error:', error);
      setAnalysisProgress('');
      toast({
        title: "Virhe analyysissä",
        description: error.message || 'DCF-analyysi epäonnistui',
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-success/10 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Valmis
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="default" className="bg-info/10 text-info">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Käsitellään
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Epäonnistui
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fi-FI', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Analysis Control Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            DCF-skenaarioanalyysi
            {analysis && getStatusBadge(analysis.status)}
          </CardTitle>
          
          {!analysis || analysis.status === 'failed' ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Järjestelmä analysoi tilinpäätöksesi ja luo kolme DCF-skenaariota: 
                pessimistinen, realistinen ja optimistinen. Analyysi perustuu historiallisiin 
                taloustietoihin ja laskee tulevaisuuden kassavirta-arviot.
              </div>
              
              <Button 
                onClick={runDCFAnalysis} 
                disabled={isAnalyzing || !latestValuation}
                className="w-fit"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {analysisProgress || 'Analysoidaan...'}
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Aloita DCF-analyysi
                  </>
                )}
              </Button>
              
              {isAnalyzing && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Analyysi kestää 2-5 minuuttia. Claude lukee tilinpäätöksiä ja laskee DCF-projektioita.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : analysis.status === 'processing' ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Analyysi on käynnissä. Tämä voi kestää muutaman minuutin...
              </AlertDescription>
            </Alert>
          ) : analysis.status === 'completed' && analysis.structured_data ? (
            <div className="text-sm text-muted-foreground">
              Analyysi valmistunut {formatDate(analysis.analysis_date)}
            </div>
          ) : null}
          
          {analysis?.error_message && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Virhe analyysissä: {analysis.error_message}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
      </Card>

      {/* Analysis Results */}
      {analysis?.structured_data && analysis.status === 'completed' && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Yhteenveto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {analysis.structured_data.executive_summary}
              </p>
            </CardContent>
          </Card>

          {/* Historical Analysis */}
          <HistoricalAnalysisCard analysis={analysis.structured_data.historical_analysis} />
          
          {/* Scenario Comparison */}
          <ScenarioComparisonCard scenarios={analysis.structured_data.scenario_projections} />
          
          {/* Valuation Summary */}
          <ValuationSummaryCard summary={analysis.structured_data.valuation_summary} />
          
          {/* Risk Analysis */}
          <RiskAnalysisCard risks={analysis.structured_data.risk_analysis} />
          
          {/* Recommendations */}
          <RecommendationsCard recommendations={analysis.structured_data.recommendations} />
        </div>
      )}
    </div>
  );
};

// Temporary placeholder components - will be implemented next
const HistoricalAnalysisCard: React.FC<{ analysis: DCFStructuredData['historical_analysis'] }> = ({ analysis }) => (
  <Card>
    <CardHeader>
      <CardTitle>Historiallinen analyysi</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-success">
            {(analysis.trends.revenue_cagr * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">Liikevaihdon kasvu (CAGR)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-info">
            {(analysis.trends.ebitda_margin_avg * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">EBITDA-marginaali</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {(analysis.wacc_estimate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground">WACC-arvio</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-warning">
            {formatCurrency(analysis.net_debt)}
          </div>
          <div className="text-sm text-muted-foreground">Nettovelka</div>
        </div>
      </div>
      <div className="mt-4 bg-muted p-3 rounded text-sm">
        {analysis.analysis_notes}
      </div>
    </CardContent>
  </Card>
);

const ScenarioComparisonCard: React.FC<{ scenarios: DCFStructuredData['scenario_projections'] }> = ({ scenarios }) => (
  <Card>
    <CardHeader>
      <CardTitle>DCF-skenaariot</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(scenarios).map(([key, scenario]) => (
          <div key={key} className="border rounded p-4">
            <h3 className="font-semibold mb-2 capitalize">{key}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Oman pääoman arvo:</span>
                <span className="font-bold">{formatCurrency(scenario.projections.equity_value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">WACC:</span>
                <span>{(scenario.assumptions.wacc * 100).toFixed(1)}%</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground bg-muted p-2 rounded">
              {scenario.rationale}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ValuationSummaryCard: React.FC<{ summary: DCFStructuredData['valuation_summary'] }> = ({ summary }) => (
  <Card>
    <CardHeader>
      <CardTitle>Arvostusyhteenveto</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-destructive">{formatCurrency(summary.equity_value_range.min)}</div>
          <div className="text-sm text-muted-foreground">Minimi</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-info">{formatCurrency(summary.equity_value_range.base)}</div>
          <div className="text-sm text-muted-foreground">Base case</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-success">{formatCurrency(summary.equity_value_range.max)}</div>
          <div className="text-sm text-muted-foreground">Maksimi</div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Keskeiset arvotekijät:</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          {summary.key_value_drivers.map((driver, index) => (
            <li key={index}>{driver}</li>
          ))}
        </ul>
      </div>
    </CardContent>
  </Card>
);

const RiskAnalysisCard: React.FC<{ risks: DCFStructuredData['risk_analysis'] }> = ({ risks }) => (
  <Card>
    <CardHeader>
      <CardTitle>Riskianalyysi</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-destructive mb-2">Suuret riskit:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {risks.high_risks.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-warning mb-2">Keskisuuret riskit:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {risks.medium_risks.map((risk, index) => (
              <li key={index}>{risk}</li>
            ))}
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
);

const RecommendationsCard: React.FC<{ recommendations: DCFStructuredData['recommendations'] }> = ({ recommendations }) => (
  <Card>
    <CardHeader>
      <CardTitle>Suositukset</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-success mb-2">Arvonluonti:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {recommendations.value_creation.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-info mb-2">Operatiiviset parannukset:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {recommendations.operational_improvements.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-primary mb-2">Strategiset aloitteet:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {recommendations.strategic_initiatives.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
);