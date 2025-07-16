import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, AlertTriangle, Scale, User, ChevronRight, BarChart, LineChart, Building } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ValuationScore {
  documentation: number;
  process: number;
  financial: number;
  customers: number;
}

interface ValuationRange {
  low: number;
  high: number;
}

interface ValuationNumbers {
  range?: ValuationRange;
  most_likely_value?: number;
  valuation_rationale?: string;
  book_value?: number;
  calculated_net_debt?: number;
  valuation_methods_in_average?: number;
}

interface KeyPoints {
  title: string;
  content: string;
}

interface AnalysisSection {
  title: string;
  content: string;
}

interface Recommendation {
  category?: string;
  title: string;
  description: string;
}

interface ValuationReportData {
  scores?: ValuationScore;
  totalScore?: number;
  key_points?: KeyPoints;
  valuation_numbers?: ValuationNumbers;
  analysis?: Record<string, AnalysisSection>;
  recommendations?: Recommendation[];
  error?: string;
}

interface EnhancedValuationReportProps {
  report: ValuationReportData;
}

/**
 * Parannettu komponentti yrityksen arvonmääritysraportin näyttämiseen
 */
const EnhancedValuationReport: React.FC<EnhancedValuationReportProps> = ({ report }) => {
  // Format currency value with euro symbol
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "Ei tietoa";

    // Näyttää 0 desimaalia kokonaisluvuille, 2 desimaalia muille
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };

    if (!Number.isInteger(value)) {
      options.minimumFractionDigits = 2;
      options.maximumFractionDigits = 2;
    }

    return new Intl.NumberFormat('fi-FI', options).format(value);
  };

  // Determine score level class
  const getScoreClass = (score: number | undefined): string => {
    if (score === undefined || isNaN(score)) return "text-slate-500";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-info";
    if (score >= 40) return "text-yellow-600";
    return "text-destructive";
  };

  // Determine score level text
  const getScoreLevel = (score: number | undefined): string => {
    if (score === undefined || isNaN(score)) return "Ei arvioitu";
    if (score >= 80) return "Erinomainen";
    if (score >= 60) return "Hyvä";
    if (score >= 40) return "Tyydyttävä";
    if (score >= 20) return "Välttävä";
    return "Heikko";
  };

  // Check if the report object itself exists and doesn't have a top-level error
  const reportExists = !!report;
  const hasReportError = !!report?.error;

  // Check for meaningful data within the report object
  const hasScores = reportExists && report.scores && report.totalScore !== undefined && !isNaN(report.totalScore);

  const hasValuation = reportExists && report.valuation_numbers &&
    ((report.valuation_numbers.range && report.valuation_numbers.range.low !== undefined) ||
      (report.valuation_numbers.most_likely_value !== undefined && 
       !isNaN(report.valuation_numbers.most_likely_value)));

  const hasAnalysisContent = reportExists && (
    report.key_points?.content ||
    (report.analysis && Object.keys(report.analysis).length > 0) ||
    (report.recommendations && report.recommendations.length > 0)
  );

  // Determine if there's *any* data to display beyond potential errors
  const hasDisplayableData = hasScores || hasValuation || hasAnalysisContent;

  // Group recommendations by category
  const groupedRecommendations = React.useMemo(() => {
    if (!report.recommendations || report.recommendations.length === 0) return {};

    const groups: Record<string, Recommendation[]> = {};

    report.recommendations.forEach(rec => {
      const category = rec.category || "Muut";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(rec);
    });

    return groups;
  }, [report.recommendations]);

  // 1. Handle Top-Level Errors or Missing Report Object
  if (hasReportError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Virhe arvonmäärityksessä</AlertTitle>
        <AlertDescription>{report.error}</AlertDescription>
      </Alert>
    );
  }

  // 2. Handle Case Where Report Exists but No Displayable Data Was Generated
  if (!reportExists || !hasDisplayableData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Arvonmääritystä ei voitu tehdä</AlertTitle>
        <AlertDescription>
          Tietoja ei ollut riittävästi arvonmäärityksen tai analyysin tuottamiseen.
          Varmista, että syötit oikeat tiedot ja yritä tarvittaessa uudelleen.
        </AlertDescription>
      </Alert>
    );
  }

  // 3. Render the Full Report if Data Exists
  return (
    <div className="space-y-6">
      {/* --- Valuation Summary Card --- */}
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <Badge variant="outline" className="mb-2 w-fit border-primary/30">Arvonmäärityksen yhteenveto</Badge>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Yrityksen arvonmääritys (Oma Pääoma)
          </CardTitle>
          <CardDescription>
            Tekoäly on analysoinut yrityksesi tiedot ja luonut arvion yrityksen omistajien osuuden arvosta (Equity Value).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* --- Valuation Numbers Section (Equity Value Focus) --- */}
          {hasValuation && (
            <div className="border rounded-xl p-6 mb-6 bg-primary/5 border-primary/30">
              <h3 className="text-xl font-bold mb-6 flex items-center text-primary">
                <Scale className="h-5 w-5 mr-2 text-primary" />
                Arvoarvio (Oma Pääoma)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Arvohaarukka */}
                {report.valuation_numbers?.range && report.valuation_numbers.range.low !== undefined && (
                  <div className="p-5 bg-white rounded-lg border border-primary/20">
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Arvohaarukka</h4>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(report.valuation_numbers.range.low)} – {formatCurrency(report.valuation_numbers.range.high)}
                    </p>
                  </div>
                )}

                {/* Keskimääräinen arvio */}
                {report.valuation_numbers?.most_likely_value !== undefined && (
                  <div className="p-5 bg-white rounded-lg border border-primary/20">
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Todennäköisin arvo</h4>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(report.valuation_numbers.most_likely_value)}</p>
                    {report.valuation_numbers?.valuation_methods_in_average !== undefined && (
                      <p className="text-xs text-slate-400 mt-1">
                        Perustuu {report.valuation_numbers.valuation_methods_in_average} arvostusmenetelmään
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Arvonmäärityksen perusteet */}
              {report.valuation_numbers?.valuation_rationale && (
                <div className="bg-white p-5 rounded-lg mt-4 border border-primary/20">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Arvonmäärityksen perusteet</h4>
                  <p className="text-sm whitespace-pre-line">{report.valuation_numbers.valuation_rationale}</p>
                </div>
              )}

              {/* Kontekstitiedot: Oma pääoma ja Nettovelka */}
              {(report.valuation_numbers?.book_value !== undefined || report.valuation_numbers?.calculated_net_debt !== undefined) && (
                <div className="bg-white p-5 rounded-lg mt-4 border border-primary/20">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Taseen ja velkojen vaikutus</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {report.valuation_numbers?.book_value !== undefined && (
                      <div className="bg-slate-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Oman pääoman kirja-arvo:</span>
                          <span className="font-medium">{formatCurrency(report.valuation_numbers.book_value)}</span>
                        </div>
                      </div>
                    )}
                    {report.valuation_numbers?.calculated_net_debt !== undefined && (
                      <div className="bg-slate-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Laskennallinen nettovelka:</span>
                          <span className="font-medium">{formatCurrency(report.valuation_numbers.calculated_net_debt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-4">
                    Nettovelka vähennetään yrityksen velattomasta arvosta (EV) laskettaessa omistajien osuuden arvoa.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* --- Scores Section --- */}
          {hasScores && (
            <div className="mb-8">
              {report.totalScore !== undefined && (
                <div className="bg-white border rounded-xl p-5 text-center mb-6">
                  <p className="text-sm font-medium text-slate-500 mb-1">Yrityksen kokonaispisteet</p>
                  <div className={`text-6xl font-bold ${getScoreClass(report.totalScore)} mb-1`}>
                    {report.totalScore}/100
                  </div>
                  <p className={`font-medium ${getScoreClass(report.totalScore)}`}>
                    {getScoreLevel(report.totalScore)}
                  </p>
                </div>
              )}

              {report.scores && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {Object.entries(report.scores).map(([key, value]) => {
                    // Get human-readable category name
                    const categoryName = {
                      'documentation': 'Dokumentaatio',
                      'process': 'Prosessit',
                      'financial': 'Talous',
                      'customers': 'Asiakkaat'
                    }[key] || key.replace('_', ' ');

                    // Get appropriate icon
                    const categoryIcon = {
                      'documentation': <Badge className="bg-muted text-muted-foreground">Dokumentaatio</Badge>,
                      'process': <Badge className="bg-info/10 text-info">Prosessit</Badge>,
                      'financial': <Badge className="bg-success/10 text-success">Talous</Badge>,
                      'customers': <Badge className="bg-warning/10 text-warning">Asiakkaat</Badge>
                    }[key] || null;

                    return (
                      <Card key={key} className="bg-slate-50 border text-center overflow-hidden">
                        <CardHeader className="pb-2 pt-4">
                          <div className="flex justify-center">
                            {categoryIcon}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-5">
                          <h3 className="font-medium text-slate-600 capitalize mb-1">{categoryName}</h3>
                          <p className={`text-3xl font-bold ${getScoreClass(value)}`}>{value}/100</p>
                          <p className={`text-xs ${getScoreClass(value)}`}>{getScoreLevel(value)}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* --- Key Points Section --- */}
          {report.key_points?.content && (
            <div className="border rounded-xl p-6 mb-6 bg-slate-50">
              <h3 className="text-lg font-semibold flex items-center mb-3">
                <BarChart className="h-5 w-5 mr-2 text-primary" />
                {report.key_points.title || "Keskeiset havainnot"}
              </h3>
              <div className="bg-white p-4 rounded-lg">
                <p className="whitespace-pre-line">{report.key_points.content}</p>
              </div>
            </div>
          )}

          {/* --- Detailed Analysis Sections --- */}
          {report.analysis && Object.keys(report.analysis).length > 0 && (
            <div className="space-y-5 mb-6">
              <h2 className="text-xl font-semibold border-b pb-2 flex items-center mb-4">
                <LineChart className="h-5 w-5 mr-2 text-primary" />
                Tarkempi analyysi
              </h2>

              {Object.entries(report.analysis).map(([key, section]) => {
                if (!section || !section.title || !section.content) return null;

                // Determine which section we're dealing with for custom styling
                const isBusinessModel = key === 'business_model' || 
                                       section.title.toLowerCase().includes('liiketoiminta');
                const isRiskAssessment = key === 'risk_assessment' || 
                                        section.title.toLowerCase().includes('riski');
                const isValuationMethods = key === 'valuation_methods' || 
                                           section.title.toLowerCase().includes('arvostus');
                const isFinancialPerformance = key === 'financial_performance' || 
                                              section.title.toLowerCase().includes('taloudellinen');

                // Set color scheme based on section type
                let bgColor = "bg-muted/50";
                let borderColor = "border-muted";
                let iconComponent = <ChevronRight className="h-5 w-5 text-muted-foreground" />;

                if (isBusinessModel) {
                  bgColor = "bg-blue-50";
                  borderColor = "border-blue-200";
                  iconComponent = <Building className="h-5 w-5 text-info" />;
                } else if (isRiskAssessment) {
                  bgColor = "bg-warning/5";
                  borderColor = "border-warning/20";
                  iconComponent = <AlertTriangle className="h-5 w-5 text-warning" />;
                } else if (isValuationMethods) {
                  bgColor = "bg-primary/5";
                  borderColor = "border-primary/30";
                  iconComponent = <Scale className="h-5 w-5 text-primary" />;
                } else if (isFinancialPerformance) {
                  bgColor = "bg-success/5";
                  borderColor = "border-success/20";
                  iconComponent = <BarChart className="h-5 w-5 text-success" />;
                }

                return (
                  <div key={key} className={`border rounded-xl p-5 ${bgColor} ${borderColor}`}>
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      {iconComponent}
                      <span className="ml-2">{section.title}</span>
                    </h3>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="whitespace-pre-line">{section.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Recommendations Card --- */}
      {report.recommendations && report.recommendations.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <Badge variant="outline" className="mb-2 w-fit border-primary/30">Toimenpidesuositukset</Badge>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Suositukset arvon kasvattamiseksi
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.entries(groupedRecommendations).length > 0 ? (
              <>
                {Object.entries(groupedRecommendations).map(([category, recs]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-lg font-medium mb-3 flex items-center">
                      <Badge className="mr-2">{category}</Badge>
                    </h3>

                    <div className="space-y-4">
                      {recs.map((recommendation, index) => (
                        recommendation && recommendation.title && recommendation.description ? (
                          <div key={index} className="border rounded-xl p-5 bg-white">
                            <div className="flex items-start gap-4">
                              <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={16} />
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-lg font-medium mb-2">{recommendation.title}</h4>
                                <p className="text-slate-600 whitespace-pre-line">{recommendation.description}</p>
                              </div>
                            </div>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-4">
                {report.recommendations.map((recommendation, index) => (
                  recommendation && recommendation.title && recommendation.description ? (
                    <div key={index} className="border rounded-xl p-5 bg-white">
                      <div className="flex items-start gap-4">
                        <div className="bg-indigo-100 text-indigo-700 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                          <User size={16} />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-lg font-medium mb-2">{recommendation.title}</h4>
                          <p className="text-slate-600 whitespace-pre-line">{recommendation.description}</p>
                          {recommendation.category && (
                            <Badge variant="outline" className="mt-3">{recommendation.category}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedValuationReport;