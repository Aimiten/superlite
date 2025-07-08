// src/components/tasks/SalesReadinessDetails.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReadinessAnalysis } from "../../../supabase/functions/_shared/types";
import { Check, X, AlertCircle, FileText, BarChart, Users, FileCheck } from "lucide-react";

interface SalesReadinessDetailsProps {
  analysis: SalesReadinessAnalysis;
  previousAnalysis?: SalesReadinessAnalysis; // Uusi valinnainen prop aiemmalle analyysille
  showComparison?: boolean; // Uusi prop joka määrittää näytetäänkö vertailu
}

/**
 * Komponentti joka näyttää Geminin tuottaman myyntikuntoisuusanalyysin
 */
const SalesReadinessDetails: React.FC<SalesReadinessDetailsProps> = ({ 
  analysis, 
  previousAnalysis,
  showComparison = false
}) => {
  if (!analysis) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">Myyntikuntoisuusanalyysiä ei ole saatavilla</p>
      </div>
    );
  }

  // Jos näytetään vertailu ja aiempi analyysi on saatavilla
  if (showComparison && previousAnalysis) {
    return (
      <Tabs defaultValue="updated">
        <TabsList className="mb-4">
          <TabsTrigger value="updated">Päivitetty analyysi</TabsTrigger>
          <TabsTrigger value="original">Alkuperäinen analyysi</TabsTrigger>
        </TabsList>
        <TabsContent value="updated">
          {renderAnalysisContent(analysis)}
        </TabsContent>
        <TabsContent value="original">
          {renderAnalysisContent(previousAnalysis)}
        </TabsContent>
      </Tabs>
    );
  }

  // Muuten näytetään vain nykyinen analyysi
  return renderAnalysisContent(analysis);
};

// Eriytetään renderöintilogiikka omaksi funktiokseen
const renderAnalysisContent = (analysis: SalesReadinessAnalysis) => {
  return (
    <div className="space-y-6">
      {/* Sanallinen yhteenveto */}
      {analysis.sanallinenYhteenveto && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-base font-medium mb-2">Analyysin yhteenveto</h3>
                <p className="text-sm text-slate-700">{analysis.sanallinenYhteenveto}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Analyysi perustuu {analysis.perustuuTehtaviin} suoritettuun tehtävään.
                  Luotu {new Date(analysis.analyysiPvm).toLocaleDateString('fi-FI')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kvantitatiiviset arviot */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Kvantitatiiviset arviot</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(analysis.kvantitatiivisetArviot).map(([key, value]) => (
            <Card key={key} className="overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(key)}
                  <h4 className="text-sm font-medium">{getCategoryName(key)}</h4>
                </div>
              </div>
              <CardContent className="pt-4">
                {renderKvArvioDetails(key, value)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Apufunktio kategorian ikonin valintaan
 */
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'asiakaskeskittyneisyys':
      return <Users className="h-4 w-4 text-blue-600" />;
    case 'avainhenkiloRiippuvuus':
      return <Users className="h-4 w-4 text-purple-600" />;
    case 'sopimusrakenne':
      return <FileCheck className="h-4 w-4 text-green-600" />;
    case 'dokumentaatio':
      return <FileText className="h-4 w-4 text-amber-600" />;
    default:
      return <BarChart className="h-4 w-4 text-slate-600" />;
  }
};

/**
 * Apufunktio kategorian nimen käännökseen
 */
const getCategoryName = (category: string): string => {
  const categoryNames: Record<string, string> = {
    'asiakaskeskittyneisyys': 'Asiakaskeskittyneisyys',
    'avainhenkiloRiippuvuus': 'Avainhenkilöriippuvuus',
    'sopimusrakenne': 'Sopimusrakenne',
    'dokumentaatio': 'Dokumentaation taso',
    'taloudelliset': 'Taloudelliset tekijät',
    'juridiset': 'Juridiset tekijät',
    'henkilosto': 'Henkilöstötekijät',
    'operatiiviset': 'Operatiiviset tekijät',
    'strategiset': 'Strategiset tekijät'
  };
  return categoryNames[category] || category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

/**
 * Pääfunktio kvantitatiivisten arvioiden renderöintiin
 */
const renderKvArvioDetails = (key: string, value: any) => {
  // Tarkistetaan aluksi onko arvo olemassa
  if (!value) return <p className="text-sm text-muted-foreground">Tietoja ei saatavilla</p>;

  // Perustelu-kenttä on yleinen kaikissa arvioissa
  const renderPerustelu = (perustelu?: string) => 
    perustelu ? <p className="text-sm text-muted-foreground mt-3 italic">{perustelu}</p> : null;

  // Arvokohtainen renderöinti
  switch(key) {
    case 'asiakaskeskittyneisyys':
      return (
        <div className="space-y-3">
          {/* Top1 prosentti */}
          {value.arvioituTop1Prosentti !== null && value.arvioituTop1Prosentti !== undefined ? (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Suurimman asiakkaan osuus:</span>
                <Badge variant="outline" className={getConcentrationBadgeClass(value.arvioituTop1Prosentti, [10, 20, 30])}>
                  {value.arvioituTop1Prosentti}%
                </Badge>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full ${getConcentrationBarColor(value.arvioituTop1Prosentti, [10, 20, 30])}`}
                  style={{ width: `${Math.min(100, value.arvioituTop1Prosentti)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm">Suurimman asiakkaan osuus:</span>
              <span className="text-sm text-muted-foreground">Ei tiedossa</span>
            </div>
          )}

          {/* Top5 prosentti */}
          {value.arvioituTop5Prosentti !== null && value.arvioituTop5Prosentti !== undefined ? (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Top 5 asiakkaiden osuus:</span>
                <Badge variant="outline" className={getConcentrationBadgeClass(value.arvioituTop5Prosentti, [40, 60, 70])}>
                  {value.arvioituTop5Prosentti}%
                </Badge>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full ${getConcentrationBarColor(value.arvioituTop5Prosentti, [40, 60, 70])}`}
                  style={{ width: `${Math.min(100, value.arvioituTop5Prosentti)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm">Top 5 asiakkaiden osuus:</span>
              <span className="text-sm text-muted-foreground">Ei tiedossa</span>
            </div>
          )}

          {/* Arvovaikutus */}
          {value.arvovaikutus && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vaikutus arvoon:</span>
                <Badge variant="outline" className={getImpactBadgeClass(value.arvovaikutus.vaikutusprosentti)}>
                  {formatImpactPercentage(value.arvovaikutus.vaikutusprosentti)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{value.arvovaikutus.perustelu}</p>
            </div>
          )}

          {renderPerustelu(value.perustelu)}
        </div>
      );

    case 'henkilosto':
      return (
        <div className="space-y-3">
          {/* Riippuvuustaso */}
          {value.arvioituTaso && value.arvioituTaso !== 'unknown' ? (
            <div className="flex justify-between items-center">
              <span className="text-sm">Riippuvuuden taso:</span>
              <Badge variant="outline" className={getDependencyBadgeClass(value.arvioituTaso)}>
                {translateDependencyLevel(value.arvioituTaso)}
              </Badge>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm">Riippuvuuden taso:</span>
              <span className="text-sm text-muted-foreground">Ei tiedossa</span>
            </div>
          )}

          {/* Lieventävät toimenpiteet */}
          {value.havaittuLievennys && (
            <div className="space-y-1 pt-1">
              <p className="text-sm font-medium mb-1">Lieventävät toimenpiteet:</p>
              <div className="grid grid-cols-1 gap-1">
                <div className="flex items-center">
                  {value.havaittuLievennys.seuraajasuunnitelma ? 
                    <Check className="h-4 w-4 text-green-600 mr-2" /> : 
                    <X className="h-4 w-4 text-red-600 mr-2" />}
                  <span className="text-sm">Seuraajasuunnitelma</span>
                </div>
                <div className="flex items-center">
                  {value.havaittuLievennys.avainSopimukset ? 
                    <Check className="h-4 w-4 text-green-600 mr-2" /> : 
                    <X className="h-4 w-4 text-red-600 mr-2" />}
                  <span className="text-sm">Avainsopimukset</span>
                </div>
                <div className="flex items-center">
                  {value.havaittuLievennys.tietojenSiirto ? 
                    <Check className="h-4 w-4 text-green-600 mr-2" /> : 
                    <X className="h-4 w-4 text-red-600 mr-2" />}
                  <span className="text-sm">Tietojen siirto</span>
                </div>
              </div>
            </div>
          )}

          {/* Arvovaikutus */}
          {value.arvovaikutus && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vaikutus arvoon:</span>
                <Badge variant="outline" className={getImpactBadgeClass(value.arvovaikutus.vaikutusprosentti)}>
                  {formatImpactPercentage(value.arvovaikutus.vaikutusprosentti)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{value.arvovaikutus.perustelu}</p>
            </div>
          )}

          {renderPerustelu(value.perustelu)}
        </div>
      );

    case 'sopimusrakenne':
      return (
        <div className="space-y-3">
          {/* Sopimusperustainen prosentti */}
          {value.arvioituSopimuspohjainenProsentti !== null && value.arvioituSopimuspohjainenProsentti !== undefined ? (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Sopimuspohjainen liikevaihto:</span>
                <Badge variant="outline" className={getContractBadgeClass(value.arvioituSopimuspohjainenProsentti)}>
                  {value.arvioituSopimuspohjainenProsentti}%
                </Badge>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.min(100, value.arvioituSopimuspohjainenProsentti)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm">Sopimuspohjainen liikevaihto:</span>
              <span className="text-sm text-muted-foreground">Ei tiedossa</span>
            </div>
          )}

          {/* Keskimääräinen kesto */}
          {value.arvioituKeskimKestoVuosina !== null && value.arvioituKeskimKestoVuosina !== undefined ? (
            <div className="flex justify-between items-center">
              <span className="text-sm">Sopimusten keskimääräinen kesto:</span>
              <Badge variant="outline" className={getDurationBadgeClass(value.arvioituKeskimKestoVuosina)}>
                {value.arvioituKeskimKestoVuosina} vuotta
              </Badge>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm">Sopimusten keskimääräinen kesto:</span>
              <span className="text-sm text-muted-foreground">Ei tiedossa</span>
            </div>
          )}

          {/* Arvovaikutus */}
          {value.arvovaikutus && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vaikutus arvoon:</span>
                <Badge variant="outline" className={getImpactBadgeClass(value.arvovaikutus.vaikutusprosentti)}>
                  {formatImpactPercentage(value.arvovaikutus.vaikutusprosentti)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{value.arvovaikutus.perustelu}</p>
            </div>
          )}

          {renderPerustelu(value.perustelu)}
        </div>
      );

    case 'dokumentaatio':
      return (
        <div className="space-y-3">
          {/* Dokumentaation taso pisteinä */}
          {value.arvioituTasoPisteet !== null && value.arvioituTasoPisteet !== undefined ? (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Dokumentaation taso:</span>
                <Badge variant="outline" className={getDocumentationBadgeClass(value.arvioituTasoPisteet)}>
                  {value.arvioituTasoPisteet}/100
                </Badge>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full ${getDocumentationBarColor(value.arvioituTasoPisteet)}`}
                  style={{ width: `${Math.min(100, value.arvioituTasoPisteet)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-sm">Dokumentaation taso:</span>
              <span className="text-sm text-muted-foreground">Ei tiedossa</span>
            </div>
          )}

          {/* Puutteet dokumentaatiossa */}
          {value.puutteet && value.puutteet.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Havaitut puutteet:</p>
              <ul className="space-y-1">
                {value.puutteet.map((puute: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{puute}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Arvovaikutus */}
          {value.arvovaikutus && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vaikutus arvoon:</span>
                <Badge variant="outline" className={getImpactBadgeClass(value.arvovaikutus.vaikutusprosentti)}>
                  {formatImpactPercentage(value.arvovaikutus.vaikutusprosentti)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{value.arvovaikutus.perustelu}</p>
            </div>
          )}

          {renderPerustelu(value.perustelu)}
        </div>
      );

    // Yksinkaistettu tapaus muille kategorioille (taloudelliset, juridiset, operatiiviset, strategiset)
    case 'taloudelliset':
    case 'juridiset':
    case 'operatiiviset':
    case 'strategiset':
      return (
        <div className="space-y-3">
          {/* Kokonaisarvio */}
          {value.kokonaisarvio !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Kokonaisarvio:</span>
                <Badge variant="outline" className={getScoreBadgeClass(value.kokonaisarvio)}>
                  {value.kokonaisarvio}/10
                </Badge>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className={`h-full rounded-full ${getScoreBarColor(value.kokonaisarvio)}`}
                  style={{ width: `${Math.min(100, value.kokonaisarvio * 10)}%` }}
                />
              </div>
            </div>
          )}

          {/* Arvovaikutus */}
          {value.arvovaikutus && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Vaikutus arvoon:</span>
                <Badge variant="outline" className={getImpactBadgeClass(value.arvovaikutus.vaikutusprosentti)}>
                  {formatImpactPercentage(value.arvovaikutus.vaikutusprosentti)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{value.arvovaikutus.perustelu}</p>
            </div>
          )}

          {renderPerustelu(value.perustelu)}
        </div>
      );

    // Fallback, jos kyseessä on tuntematon arvio tai rakenne on yllättävä
    default:
      // Jos arvo on objekti, näytetään sen avain-arvo -parit
      if (typeof value === 'object' && value !== null) {
        return (
          <div className="space-y-2">
            {Object.entries(value).map(([subKey, subValue]) => {
              // Skip perustelu; we'll render it at the end
              if (subKey === 'perustelu') return null;

              return (
                <div key={subKey} className="flex justify-between items-center">
                  <span className="text-sm">{formatKey(subKey)}:</span>
                  <span className="text-sm font-medium">{formatValue(subValue)}</span>
                </div>
              );
            })}
            {renderPerustelu(value.perustelu)}
          </div>
        );
      }

      // Jos mikään muu ei toimi, näytetään JSON-muodossa
      return <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(value, null, 2)}</pre>;
  }
};

/** 
 * Apufunktioita luokituksiin ja formatointiin
 */

// Arvovaikutuksen muotoilu
const formatImpactPercentage = (value: number): string => {
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const getImpactBadgeClass = (value: number): string => {
  if (value > 3) return "bg-green-100 text-green-800 border-green-200";
  if (value < -3) return "bg-red-100 text-red-800 border-red-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
};

// Yleinen arvosana 1-10
const getScoreBadgeClass = (value: number): string => {
  if (value >= 8) return "bg-green-100 text-green-800 border-green-200";
  if (value >= 6) return "bg-blue-100 text-blue-800 border-blue-200";
  if (value >= 4) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
};

const getScoreBarColor = (value: number): string => {
  if (value >= 8) return "bg-green-500";
  if (value >= 6) return "bg-blue-500";
  if (value >= 4) return "bg-yellow-500";
  return "bg-red-500";
};

// Asiakaskeskittyneisyys
const getConcentrationBadgeClass = (value: number, thresholds: number[]): string => {
  if (value <= thresholds[0]) return "bg-green-100 text-green-800 border-green-200";
  if (value <= thresholds[1]) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
};

const getConcentrationBarColor = (value: number, thresholds: number[]): string => {
  if (value <= thresholds[0]) return "bg-green-500";
  if (value <= thresholds[1]) return "bg-yellow-500";
  return "bg-red-500";
};

// Avainhenkilöriippuvuus
const getDependencyBadgeClass = (level: string): string => {
  switch (level) {
    case 'low': return "bg-green-100 text-green-800 border-green-200";
    case 'moderate': return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case 'high': return "bg-orange-100 text-orange-800 border-orange-200";
    case 'critical': return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

const translateDependencyLevel = (level: string): string => {
  const translations: Record<string, string> = {
    'critical': 'Kriittinen',
    'high': 'Korkea',
    'moderate': 'Keskitaso',
    'low': 'Matala',
    'unknown': 'Ei tiedossa'
  };
  return translations[level] || level;
};

// Sopimusrakenne
const getContractBadgeClass = (percentage: number): string => {
  if (percentage >= 80) return "bg-green-100 text-green-800 border-green-200";
  if (percentage >= 50) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
};

const getDurationBadgeClass = (years: number): string => {
  if (years >= 3) return "bg-green-100 text-green-800 border-green-200";
  if (years >= 1) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-yellow-100 text-yellow-800 border-yellow-200";
};

// Dokumentaatio
const getDocumentationBadgeClass = (score: number): string => {
  if (score >= 90) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 75) return "bg-blue-100 text-blue-800 border-blue-200";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
};

const getDocumentationBarColor = (score: number): string => {
  if (score >= 90) return "bg-green-500";
  if (score >= 75) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

// Yleiset
const formatKey = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'Ei tiedossa';
  if (typeof value === 'boolean') return value ? 'Kyllä' : 'Ei';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.join(', ');
  return JSON.stringify(value);
};

export default SalesReadinessDetails;