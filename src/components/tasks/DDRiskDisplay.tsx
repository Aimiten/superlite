// src/components/tasks/DDRiskDisplay.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertCircle, 
  FileWarning, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb, 
  PlusCircle,
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from "lucide-react";

import DDRiskRadarChart from "./DDRiskRadarChart";
import { DDRiskAnalysis, DDRiskCategory, RiskMitigationAnalysis } from "../../../supabase/functions/_shared/types";

interface DDRiskDisplayProps {
  ddRiskAnalysis: DDRiskAnalysis | null;
  isLoading?: boolean;
  error?: string | null;
  onGenerateTasks?: () => void;
  isGeneratingTasks?: boolean;
  isPostDD?: boolean; // Uusi prop: onko kyseessä post-DD analyysi
  riskienLieventaminen?: RiskMitigationAnalysis | null; // Uusi prop: riskien lieventämistiedot
}

const DDRiskDisplay: React.FC<DDRiskDisplayProps> = ({
  ddRiskAnalysis,
  isLoading = false,
  error = null,
  onGenerateTasks,
  isGeneratingTasks = false,
  isPostDD = false,
  riskienLieventaminen = null
}) => {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);

  // Helper functions for rendering
  const getRiskLevelColor = (level: number) => {
    if (level >= 8) return "bg-red-100 text-red-800 border-red-200";
    if (level >= 5) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getRiskLevelText = (level: number) => {
    if (level >= 8) return "Korkea";
    if (level >= 5) return "Keskitaso";
    return "Matala";
  };

  const getRiskImpactText = (impact: string) => {
    switch (impact) {
      case "high": return "Merkittävä";
      case "medium": return "Kohtalainen";
      case "low": return "Vähäinen";
      default: return impact;
    }
  };

  const getRiskImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-amber-100 text-amber-800 border-amber-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Uusi funktio: Laskee riskitason muutosprosentin
  const calculateRiskReduction = (originalLevel: number, currentLevel: number) => {
    if (!originalLevel || !currentLevel) return 0;
    return ((originalLevel - currentLevel) / originalLevel) * 100;
  };

  // Uusi funktio: Hakee oikean värin riskitason muutokselle
  const getRiskChangeColor = (originalLevel: number, currentLevel: number) => {
    const change = originalLevel - currentLevel;
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-slate-600";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-muted-foreground">DD-riskianalyysiä ladataan...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Virhe DD-analyysissä</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // No data state
  if (!ddRiskAnalysis) {
    return (
      <Alert className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>DD-riskianalyysi puuttuu</AlertTitle>
        <AlertDescription>
          DD-riskianalyysiä ei ole vielä suoritettu. Käynnistä analyysi kojelaudalta.
        </AlertDescription>
      </Alert>
    );
  }

  // Sort risks by risk level (highest first)
  const sortedRisks = [...ddRiskAnalysis.riskiKategoriat].sort((a, b) => b.riskitaso - a.riskitaso);

  return (
    <div className="space-y-6">
      {/* Post-DD analyysin banneri */}
      {isPostDD && riskienLieventaminen && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-700">DD-korjausten vaikutus riskeihin</AlertTitle>
          <AlertDescription className="text-blue-600">
            DD-toimenpiteet ovat pienentäneet kokonaisriskitasoa{' '}
            <span className="font-medium">
              {calculateRiskReduction(
                riskienLieventaminen.alkuperainenKokonaisRiskitaso,
                riskienLieventaminen.paivitettyKokonaisRiskitaso
              ).toFixed(1)}%
            </span>.
            Katso alla tarkempi analyysi kategoria- ja riskikohtaisista parannuksista.
          </AlertDescription>
        </Alert>
      )}

      {/* Header card with summary and radar chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Due Diligence -riskiprofiili</CardTitle>
              <CardDescription>
                Analyysi suoritettu {new Date(ddRiskAnalysis.analyysiPvm).toLocaleDateString()}
                {isPostDD && " (sisältää DD-korjausten vaikutukset)"}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Näytetään alkuperäinen ja päivitetty riskitaso jos kyseessä post-DD */}
              {isPostDD && riskienLieventaminen ? (
                <>
                  <Badge 
                    className={`${getRiskLevelColor(riskienLieventaminen.alkuperainenKokonaisRiskitaso)} text-sm px-3 py-1`}
                  >
                    Alkuperäinen riskitaso: {riskienLieventaminen.alkuperainenKokonaisRiskitaso}/10
                  </Badge>
                  <div className="flex items-center justify-center px-1">
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <Badge 
                    className={`${getRiskLevelColor(riskienLieventaminen.paivitettyKokonaisRiskitaso)} text-sm px-3 py-1`}
                  >
                    Päivitetty riskitaso: {riskienLieventaminen.paivitettyKokonaisRiskitaso}/10
                  </Badge>
                </>
              ) : (
                <Badge 
                  className={`${getRiskLevelColor(ddRiskAnalysis.kokonaisRiskitaso)} text-sm px-3 py-1`}
                >
                  Kokonaisriskitaso: {ddRiskAnalysis.kokonaisRiskitaso}/10
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Radar chart visualization */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-medium mb-2 text-slate-700">Riskijakauma kategorioittain</h3>
            <div className="h-64">
              {isPostDD && riskienLieventaminen ? (
                <DDRiskRadarChart 
                  riskCategories={ddRiskAnalysis.riskiKategoriat}
                  comparisonData={riskienLieventaminen.riskikategoriat}
                  isPostDD={true}
                />
              ) : (
                <DDRiskRadarChart riskCategories={ddRiskAnalysis.riskiKategoriat} />
              )}
            </div>
          </div>

          {/* Key findings and summary */}
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1 text-indigo-700">
                <Lightbulb className="h-4 w-4" />
                Yhteenveto
              </h3>
              {isPostDD && riskienLieventaminen ? (
                <p className="text-sm text-indigo-800">{riskienLieventaminen.yhteenveto}</p>
              ) : (
                <p className="text-sm text-indigo-800">{ddRiskAnalysis.yhteenveto}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2 text-slate-700">Keskeisimmät löydökset</h3>
              <ul className="space-y-2">
                {ddRiskAnalysis.keskeisimmatLöydökset.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        {onGenerateTasks && (
          <CardFooter className="bg-slate-50 border-t">
            <Button 
              onClick={onGenerateTasks}
              className="gap-2"
              disabled={isGeneratingTasks}
            >
              {isGeneratingTasks ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Luodaan toimenpiteitä...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Luo toimenpiteet riskien korjaamiseksi
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Riskien lieventäminen -osio (uusi) */}
      {isPostDD && riskienLieventaminen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">DD-korjausten vaikutus riskeihin</CardTitle>
            <CardDescription>
              Miten tunnistettujen riskien lieventäminen on edistynyt DD-toimenpiteiden avulla
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Riskikategoria</TableHead>
                  <TableHead className="text-center">Alkuperäinen</TableHead>
                  <TableHead className="text-center">Päivitetty</TableHead>
                  <TableHead className="text-center">Muutos</TableHead>
                  <TableHead>Edistyminen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskienLieventaminen.riskikategoriat.map((kategoria) => {
                  const change = kategoria.alkuperainenRiskitaso - kategoria.paivitettyRiskitaso;
                  const changePercentage = calculateRiskReduction(
                    kategoria.alkuperainenRiskitaso, 
                    kategoria.paivitettyRiskitaso
                  );
                  const changeColor = getRiskChangeColor(
                    kategoria.alkuperainenRiskitaso, 
                    kategoria.paivitettyRiskitaso
                  );

                  return (
                    <TableRow 
                      key={kategoria.kategoria}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedRisk(expandedRisk === kategoria.kategoria ? null : kategoria.kategoria)}
                    >
                      <TableCell className="font-medium">{kategoria.kategoria}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getRiskLevelColor(kategoria.alkuperainenRiskitaso)}>
                          {kategoria.alkuperainenRiskitaso}/10
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getRiskLevelColor(kategoria.paivitettyRiskitaso)}>
                          {kategoria.paivitettyRiskitaso}/10
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-medium ${changeColor} flex items-center justify-center`}>
                          {change > 0 ? (
                            <ChevronDown className="h-4 w-4 mr-1" />
                          ) : change < 0 ? (
                            <ChevronUp className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-1" />
                          )}
                          {change !== 0 ? Math.abs(change).toFixed(1) : '0'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {changePercentage > 0 ? `${changePercentage.toFixed(1)}% parannus` : '0% muutos'}
                            </span>
                          </div>
                          <Progress 
                            value={changePercentage} 
                            className="h-2"
                            indicatorClassName={change > 0 ? "bg-green-500" : "bg-gray-300"}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Risk details card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">DD-riskit kategorioittain</CardTitle>
          <CardDescription>
            Tarkastele tunnistettuja riskejä ja toimenpidesuosituksia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Riskikategoria</TableHead>
                <TableHead className="text-center">Taso</TableHead>
                <TableHead className="text-center">Vaikutus</TableHead>
                <TableHead>Kuvaus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRisks.map((risk) => (
                <TableRow 
                  key={risk.kategoria}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setExpandedRisk(expandedRisk === risk.kategoria ? null : risk.kategoria)}
                >
                  <TableCell className="font-medium">{risk.kategoria}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getRiskLevelColor(risk.riskitaso)}>
                      {risk.riskitaso}/10
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={getRiskImpactColor(risk.vaikutus)}>
                      {getRiskImpactText(risk.vaikutus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">{risk.kuvaus}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed risk view and recommendations */}
      <Accordion type="single" collapsible value={expandedRisk || undefined} onValueChange={setExpandedRisk as any}>
        {sortedRisks.map((risk) => {
          // Etsitään vastaavat lieventämistiedot jos kyseessä on post-DD
          const mitigationData = isPostDD && riskienLieventaminen 
            ? riskienLieventaminen.riskikategoriat.find(k => k.kategoria === risk.kategoria)
            : null;

          return (
            <AccordionItem key={risk.kategoria} value={risk.kategoria}>
              <AccordionTrigger className="px-4 hover:bg-slate-50 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Badge className={getRiskLevelColor(risk.riskitaso)}>
                    {risk.kategoria}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Riskitaso: {risk.riskitaso}/10</span>
                  {/* Näytetään muutos jos kyseessä post-DD */}
                  {mitigationData && (
                    <span className={`text-sm ${getRiskChangeColor(mitigationData.alkuperainenRiskitaso, mitigationData.paivitettyRiskitaso)}`}>
                      {mitigationData.alkuperainenRiskitaso > mitigationData.paivitettyRiskitaso ? (
                        <>
                          <ArrowDown className="h-3 w-3 inline mr-0.5" />
                          {(mitigationData.alkuperainenRiskitaso - mitigationData.paivitettyRiskitaso).toFixed(1)}
                        </>
                      ) : mitigationData.alkuperainenRiskitaso < mitigationData.paivitettyRiskitaso ? (
                        <>
                          <ArrowUp className="h-3 w-3 inline mr-0.5" />
                          {(mitigationData.paivitettyRiskitaso - mitigationData.alkuperainenRiskitaso).toFixed(1)}
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-3 w-3 inline mr-0.5" />
                          0
                        </>
                      )}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-slate-50 p-4 rounded-b-lg border-t border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Havainnot</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {risk.havainnot.map((havainto, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <FileWarning className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span>{havainto}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Toimenpidesuositukset</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {risk.toimenpideSuositukset.map((suositus, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{suositus}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Jäljellä olevat toimenpiteet DD-korjausten jälkeen (uusi osio) */}
                {mitigationData && mitigationData.jaljellaolevat_toimenpiteet && mitigationData.jaljellaolevat_toimenpiteet.length > 0 && (
                  <div className="mt-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-blue-700">Jäljellä olevat toimenpiteet</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-blue-700 mb-2">{mitigationData.muutosPerustelu}</p>
                        <ul className="space-y-2">
                          {mitigationData.jaljellaolevat_toimenpiteet.map((toimenpide, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-blue-800">{toimenpide}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default DDRiskDisplay;