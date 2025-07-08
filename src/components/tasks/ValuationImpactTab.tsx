// src/components/tasks/ValuationImpactTab.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, AlertCircle, Info, TrendingUp, TrendingDown, Minus, 
  FileBarChart, ShieldAlert, ArrowLeftRight, HelpCircle 
} from 'lucide-react'; // Lisätty HelpCircle ikoni
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Tuodaan Tooltip-komponentit
import { ValuationImpactResult } from '../../../supabase/functions/_shared/types'; // Korjattu polku
import DDRiskDisplay from './DDRiskDisplay';
import SalesReadinessDetails from './SalesReadinessDetails';
import { ValuationImpactExplanation } from "./ValuationImpactExplanation";
import { supabase } from "@/integrations/supabase/client";

interface ValuationImpactTabProps {
  valuationImpact: ValuationImpactResult | null;
  isLoading: boolean; // Onko analyysi käynnissä TAI latautumassa
  error: string | null; // Virheviesti
  onGenerateDDTasks?: () => void;
  isGeneratingTasks?: boolean;
  isPostDDAnalysis?: boolean; // Uusi prop: onko post-DD analyysi
}

// Apufunktiot (ennallaan)
const formatCurrency = (value: number | null | undefined, digits = 0): string => {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
};
const formatPercentage = (value: number | null | undefined, digits = 1): string => {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
};
const formatFactor = (factor: number | null | undefined): string => {
  if (factor === null || factor === undefined || isNaN(factor)) return "N/A";
  const change = (factor - 1) * 100;
  // Näytä "+/-" vain jos muutos ei ole käytännössä nolla
  const sign = Math.abs(change) < 0.05 ? '' : (change > 0 ? '+' : '');
  return `${factor.toFixed(3)} (${sign}${change.toFixed(1)}%)`;
};
const FactorChangeIcon = ({ factor }: { factor: number | null | undefined }) => {
  if (factor === null || factor === undefined || isNaN(factor) || Math.abs(factor - 1) < 0.001) {
    return <Minus className="h-4 w-4 text-slate-500" />;
  }
  return factor > 1 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
};

// Uusi: Tooltips-selitetekstit
const valuationMethodTooltips = {
  general: "Myyntikuntoisuusanalyysin kategoriat vaikuttavat arvostuksen kertoimiin. Korjaukset sovelletaan eri arvostusmenetelmien kertoimiin.",
  revenueMultiple: "Liikevaihtokerroin painottaa asiakaskeskittyneisyyttä, sopimusrakennetta ja strategisia tekijöitä.",
  ebitMultiple: "EBIT-kerroin painottaa operatiivisia, taloudellisia ja henkilöstötekijöitä.",
  ebitdaMultiple: "EBITDA-kerroin painottaa operatiivisia tekijöitä hieman eri tavoin kuin EBIT-kerroin.",
  overallFactor: "Kokonaiskerroin on painotettu keskiarvo kaikkien kategorioiden vaikutuksista. Myös dokumentaation vaikutus on huomioitu kokonaiskertoimessa."
};



// Helper-funktiot
function formatCategoryName(category) {
  const categoryNames = {
    taloudelliset: "Taloudelliset tekijät",
    juridiset: "Juridiset tekijät",
    asiakaskeskittyneisyys: "Asiakasrakenne",
    henkilosto: "Henkilöstötekijät",
    operatiiviset: "Operatiivinen toiminta",
    dokumentaatio: "Dokumentaation taso",
    strategiset: "Strategiset tekijät",
    sopimusrakenne: "Sopimusrakenne"
  };

  return categoryNames[category] || category;
}

function calculatePercentageChange(initial, final) {
  if (!initial || !final) return "N/A";
  const change = ((final - initial) / Math.abs(initial)) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

export const ValuationImpactTab: React.FC<ValuationImpactTabProps> = ({
  valuationImpact,
  isLoading,
  error,
  onGenerateDDTasks,
  isGeneratingTasks = false,
  isPostDDAnalysis = false
}) => {
  const [activeTab, setActiveTab] = useState<string>("valuation");
  const [previousAnalysis, setPreviousAnalysis] = useState<ValuationImpactResult | null>(null);
  const [isPreviousLoading, setIsPreviousLoading] = useState<boolean>(false);

  // Hae aiempi analyysi, jos kyseessä on post-DD analyysi
  useEffect(() => {
    const fetchPreviousAnalysis = async () => {
      if (
        valuationImpact && 
        valuationImpact.analysis_phase === 'post_due_diligence' && 
        valuationImpact.previous_analysis_id
      ) {
        setIsPreviousLoading(true);
        try {
          const { data, error } = await supabase
            .from('valuation_impact_analysis')
            .select('*')
            .eq('id', valuationImpact.previous_analysis_id)
            .single();

          if (error) throw error;
          if (data) setPreviousAnalysis(data as ValuationImpactResult);
        } catch (err) {
          console.error("Error fetching previous analysis:", err);
        } finally {
          setIsPreviousLoading(false);
        }
      }
    };

    fetchPreviousAnalysis();
  }, [valuationImpact]);

  // Lataustila
  if (isLoading || isPreviousLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Ladataan tai lasketaan arvovaikutusta...</p>
      </div>
    );
  }

  // Virhetila
  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Virhe</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Ei analyysia -tila
  if (!valuationImpact) {
    return (
      <Alert className="my-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Ei analyysia saatavilla</AlertTitle>
        <AlertDescription>
          Arvovaikutusanalyysiä ei ole vielä tehty tälle yritykselle. Suorita vähintään 75% tehtävistä ja käynnistä analyysi kojelaudalta.
        </AlertDescription>
      </Alert>
    );
  }

  // Tarkistetaan, että tarvittavat tiedot ovat saatavilla
  const originalSnapshot = valuationImpact.original_valuation_snapshot;
  const adjustedResult = valuationImpact.adjusted_valuation_result;
  const adjustmentFactors = valuationImpact.adjustment_factors;

  // Tarkistetaan onko kyseessä post-DD analyysi
  const hasPostDDAnalysis = isPostDDAnalysis || valuationImpact.analysis_phase === 'post_due_diligence';

  // Näytetään post-DD banneri jos kyseessä on post-DD analyysi
  const PostDDBanner = hasPostDDAnalysis ? (
    <Alert className="mb-6 bg-blue-50 border-blue-200">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-700">DD-korjausten jälkeinen analyysi</AlertTitle>
      <AlertDescription className="text-blue-600">
        Tämä näkymä sisältää DD-korjausten vaikutukset riskeihin ja arvoon. 
        {previousAnalysis && (
          <Button 
            variant="link" 
            className="p-0 h-auto text-blue-700 font-medium underline ml-2"
            onClick={() => window.open(`/tasks?companyId=${valuationImpact.company_id}&analysisId=${previousAnalysis.id}`, '_blank')}
          >
            Näytä alkuperäinen analyysi
          </Button>
        )}
      </AlertDescription>
    </Alert>
  ) : null;

  // Analyysi löytyi, näytetään data välilehdillä
  return (
    <div className="space-y-6 mt-6">
      {/* Näytä post-DD banneri jos kyseessä on post-DD analyysi */}
      {PostDDBanner}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="valuation" className="flex items-center gap-1">
            <FileBarChart className="h-4 w-4" />
            <span>Arvovaikutus</span>
          </TabsTrigger>
          <TabsTrigger value="dd_risks" className="flex items-center gap-1">
            <ShieldAlert className="h-4 w-4" />
            <span>DD-riskit</span>
          </TabsTrigger>
        </TabsList>

        {/* Arvovaikutus-välilehti (päivitetty) */}
        <TabsContent value="valuation" className="space-y-6">
          {/* Kortti 1: Yhteenveto ja Vertailu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Arvovaikutuksen yhteenveto
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm p-3">
                      <p>{valuationMethodTooltips.general}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Analyysi päivitetty {new Date(valuationImpact.calculation_date).toLocaleDateString('fi-FI')}, perustuen {
                  hasPostDDAnalysis && valuationImpact.post_dd_sales_readiness_analysis 
                    ? valuationImpact.post_dd_sales_readiness_analysis.perustuuTehtaviin || 0 
                    : valuationImpact.sales_readiness_analysis?.perustuuTehtaviin || 0
                } tehtävään.

                {hasPostDDAnalysis && " DD-korjaukset huomioitu tässä analyysissä."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">Alkuperäinen arvio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCurrency(originalSnapshot?.averageValuation)}</p>
                    <p className="text-sm text-muted-foreground">
                      Haarukka: {formatCurrency(originalSnapshot?.valuationRange?.low)} - {formatCurrency(originalSnapshot?.valuationRange?.high)}
                    </p>
                  </CardContent>
                </Card>
                {(() => {
                  const changePercent = calculatePercentageChange(originalSnapshot?.averageValuation, adjustedResult?.averageValuation);
                  const isPositive = !changePercent.includes('-');

                  return (
                    <Card className={isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                       <CardHeader className="pb-2">
                         <CardTitle className="text-base font-medium">Arvio myyntikuntoisuuden jälkeen</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <p className={`text-2xl font-bold ${isPositive ? "text-green-700" : "text-red-700"}`}>
                           {formatCurrency(adjustedResult?.averageValuation)}
                         </p>
                         <p className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"} mb-1`}>
                           {changePercent} muutos
                         </p>
                         <p className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                           Haarukka: {formatCurrency(adjustedResult?.valuationRange?.low)} - {formatCurrency(adjustedResult?.valuationRange?.high)}
                         </p>
                       </CardContent>
                    </Card>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Uusi selkeä vaikutusselitys */}
          <ValuationImpactExplanation
            valuationImpact={valuationImpact}
            isPostDD={hasPostDDAnalysis}
          />

          {/* Kortti 3: Geminin Analyysi */}
          <Card>
            <CardHeader>
              <CardTitle>Tekoälyn myyntikuntoisuusanalyysi</CardTitle>
              <CardDescription>
                {hasPostDDAnalysis 
                  ? "DD-korjausten vaikutukset huomioiva analyysi" 
                  : "Perustuu tehtäviin annettuihin vastauksiin."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesReadinessDetails 
                analysis={hasPostDDAnalysis && valuationImpact.post_dd_sales_readiness_analysis
                  ? valuationImpact.post_dd_sales_readiness_analysis
                  : valuationImpact.sales_readiness_analysis}
                previousAnalysis={previousAnalysis?.sales_readiness_analysis}
                showComparison={hasPostDDAnalysis && !!previousAnalysis}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* DD-riskit-välilehti (päivitetty käyttämään post_dd_risk_analysis) */}
        <TabsContent value="dd_risks">
          <DDRiskDisplay 
            ddRiskAnalysis={valuationImpact.dd_risk_analysis || null} 
            riskienLieventaminen={
              hasPostDDAnalysis && valuationImpact.post_dd_risk_analysis
                ? valuationImpact.post_dd_risk_analysis
                : null
            }
            isPostDD={hasPostDDAnalysis}
            onGenerateTasks={onGenerateDDTasks}
            isGeneratingTasks={isGeneratingTasks}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValuationImpactTab;