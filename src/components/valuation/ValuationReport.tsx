
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileBarChart, TrendingUp, Coins, Building2, Target, AlertTriangle, Scale, BarChart3 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Define proper types for the report object
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

interface WeightedAverages {
  revenue: number;
  ebit: number;
  ebitda: number;
  net_income: number;
}

interface MultiYearValuationRange {
  min: number;
  max: number;
  weighted: number;
  methods_used: string[];
}

interface MultiYearAnalysis {
  weighted_averages: WeightedAverages;
  valuation_range: MultiYearValuationRange;
  weighting_explanation: string;
  partnership_data?: {
    owner_salary?: number;
    private_usage?: number;
    transferable_assets?: number;
  };
}

interface ValuationReportData {
  scores?: ValuationScore;
  totalScore?: number;
  key_points?: KeyPoints;
  valuation_numbers?: ValuationNumbers;
  analysis?: Record<string, AnalysisSection>;
  recommendations?: Recommendation[];
  error?: string;
  rawResponse?: any;
}

interface ValuationReportProps {
  report: ValuationReportData;
  rawData?: {
    companyInfo?: any;
    financialAnalysis?: any;
    finalAnalysis?: any;
  };
}

const ValuationReport: React.FC<ValuationReportProps> = ({ report, rawData }) => {
  // Format currency value with euro symbol
  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return "Ei tietoa";
    return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const getScoreClass = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };
  
  // Check if the report has meaningful data
  const hasScores = report.scores && report.totalScore !== undefined;
  const hasValuation = report.valuation_numbers && 
    (report.valuation_numbers.range || report.valuation_numbers.most_likely_value);
  const hasAnalysis = report.key_points?.content || 
    (report.analysis && Object.keys(report.analysis).length > 0);
  
  const hasData = hasScores || hasValuation || hasAnalysis;
  
  // Extract multi-year analysis if available
  const multiYearAnalysis = rawData?.financialAnalysis?.documents?.[0]?.multi_year_analysis as MultiYearAnalysis | undefined;
  const hasMultiYearAnalysis = !!multiYearAnalysis;

  // Show raw API responses for debugging
  const showRawResponses = () => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Raw API Responses (Debug)</CardTitle>
          <CardDescription>
            The raw data returned from the API calls for debugging purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[500px] overflow-auto">
          <div className="space-y-4">
            {rawData?.companyInfo && (
              <div>
                <h3 className="text-lg font-medium mb-2">Company Info Response (Perplexity):</h3>
                <pre className="bg-slate-100 p-4 rounded-md text-xs overflow-auto">
                  {JSON.stringify(rawData.companyInfo, null, 2)}
                </pre>
              </div>
            )}
            
            {rawData?.financialAnalysis && (
              <div>
                <h3 className="text-lg font-medium mb-2">Financial Analysis Response (Gemini):</h3>
                <pre className="bg-slate-100 p-4 rounded-md text-xs overflow-auto">
                  {JSON.stringify(rawData.financialAnalysis, null, 2)}
                </pre>
              </div>
            )}
            
            {rawData?.finalAnalysis && (
              <div>
                <h3 className="text-lg font-medium mb-2">Final Analysis Response (Gemini):</h3>
                <pre className="bg-slate-100 p-4 rounded-md text-xs overflow-auto">
                  {JSON.stringify(rawData.finalAnalysis, null, 2)}
                </pre>
              </div>
            )}
            
            {!rawData?.companyInfo && !rawData?.financialAnalysis && !rawData?.finalAnalysis && (
              <p>No raw API response data available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (report.error) {
    return (
      <>
        {rawData && showRawResponses()}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Virhe arvonmäärityksessä</AlertTitle>
          <AlertDescription>{report.error}</AlertDescription>
        </Alert>
      </>
    );
  }
  
  if (!hasData && !hasMultiYearAnalysis) {
    return (
      <>
        {rawData && showRawResponses()}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Arvonmääritystä ei voitu tehdä</AlertTitle>
          <AlertDescription>
            Tietoja ei ollut riittävästi arvonmäärityksen tekemiseen. Varmista, että olet syöttänyt oikean yrityksen nimen 
            ja tilinpäätöstiedot ovat luettavassa muodossa. Sovellus tukee PDF, Excel ja CSV tiedostoja. 
            Jos ongelma jatkuu, kokeile toista yritystä tai tilinpäätöstiedostoa.
          </AlertDescription>
        </Alert>
      </>
    );
  }
  
  return (
    <div className="space-y-6">
      {rawData && showRawResponses()}
      
      <Card>
        <CardHeader>
          <Badge variant="outline" className="mb-2 w-fit">Arvonmäärityksen yhteenveto</Badge>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-indigo-600" />
            Yrityksen arvonmääritys
          </CardTitle>
          <CardDescription>
            Tekoäly on analysoinut yrityksesi tiedot ja luonut arvonmäärityksen useilla eri menetelmillä.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasMultiYearAnalysis && (
            <div className="border rounded-xl p-4 mb-6 bg-indigo-50">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-indigo-700" />
                Painotettu arvonmääritys
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Arvohaarukka</h4>
                  <p className="text-2xl font-bold text-indigo-700">
                    {formatCurrency(multiYearAnalysis.valuation_range.min)} - {formatCurrency(multiYearAnalysis.valuation_range.max)}
                  </p>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Arvioitu arvo (painotettu)</h4>
                  <p className="text-2xl font-bold text-indigo-700">{formatCurrency(multiYearAnalysis.valuation_range.weighted)}</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Painotetut tunnusluvut</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-xs text-slate-500">Liikevaihto</p>
                    <p className="font-semibold">{formatCurrency(multiYearAnalysis.weighted_averages.revenue)}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-xs text-slate-500">EBIT</p>
                    <p className="font-semibold">{formatCurrency(multiYearAnalysis.weighted_averages.ebit)}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-xs text-slate-500">EBITDA</p>
                    <p className="font-semibold">{formatCurrency(multiYearAnalysis.weighted_averages.ebitda)}</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-xs text-slate-500">Nettotulos</p>
                    <p className="font-semibold">{formatCurrency(multiYearAnalysis.weighted_averages.net_income)}</p>
                  </div>
                </div>
                
                {multiYearAnalysis.partnership_data && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Henkilöyhtiön painotetut tiedot</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {multiYearAnalysis.partnership_data.owner_salary !== undefined && (
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-xs text-slate-500">Yrittäjän palkka</p>
                          <p className="font-semibold">{formatCurrency(multiYearAnalysis.partnership_data.owner_salary)}</p>
                        </div>
                      )}
                      {multiYearAnalysis.partnership_data.private_usage !== undefined && (
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-xs text-slate-500">Yksityiskäyttö</p>
                          <p className="font-semibold">{formatCurrency(multiYearAnalysis.partnership_data.private_usage)}</p>
                        </div>
                      )}
                      {multiYearAnalysis.partnership_data.transferable_assets !== undefined && (
                        <div className="bg-slate-50 p-2 rounded">
                          <p className="text-xs text-slate-500">Siirrettävät varat</p>
                          <p className="font-semibold">{formatCurrency(multiYearAnalysis.partnership_data.transferable_assets)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Käytetyt arvostusmenetelmät</h4>
                  <div className="flex flex-wrap gap-1">
                    {multiYearAnalysis.valuation_range.methods_used.map((method, index) => (
                      <Badge key={index} variant="outline" className="bg-indigo-50">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Painotuksen perusteet</h4>
                  <p className="text-sm whitespace-pre-line">{multiYearAnalysis.weighting_explanation}</p>
                </div>
              </div>
            </div>
          )}
          
          {report.valuation_numbers && (
            <div className="border rounded-xl p-4 mb-6 bg-indigo-50">
              <h3 className="text-xl font-bold mb-3">Arvonmääritys</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {report.valuation_numbers.range && (
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Arvohaarukka</h4>
                    <p className="text-2xl font-bold text-indigo-700">
                      {formatCurrency(report.valuation_numbers.range.low)} - {formatCurrency(report.valuation_numbers.range.high)}
                    </p>
                  </div>
                )}
                
                {report.valuation_numbers.most_likely_value !== undefined && (
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-slate-500 mb-1">Todennäköisin arvo</h4>
                    <p className="text-2xl font-bold text-indigo-700">{formatCurrency(report.valuation_numbers.most_likely_value)}</p>
                  </div>
                )}
              </div>
              
              {report.valuation_numbers.valuation_rationale && (
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Arvonmäärityksen perusteet</h4>
                  <p className="text-sm whitespace-pre-line">{report.valuation_numbers.valuation_rationale}</p>
                </div>
              )}
            </div>
          )}
          
          {report.totalScore !== undefined && (
            <div className="flex items-center justify-center mb-6">
              <div className={`text-6xl font-bold ${getScoreClass(report.totalScore)}`}>
                {report.totalScore}/100
              </div>
            </div>
          )}
          
          {report.scores && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {Object.entries(report.scores).map(([key, value]) => (
                <Card key={key} className="bg-slate-50 border">
                  <CardContent className="pt-6">
                    <h3 className="font-medium text-slate-600 capitalize mb-1">{key.replace('_', ' ')}</h3>
                    <p className={`text-3xl font-bold ${getScoreClass(value)}`}>{value}/100</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {report.key_points && (
            <div className="border rounded-xl p-4 mb-6">
              <h3 className="text-lg font-medium mb-2">{report.key_points.title || "Keskeiset havainnot"}</h3>
              <p className="whitespace-pre-line">{report.key_points.content}</p>
            </div>
          )}
          
          {report.analysis && (
            <div className="space-y-4">
              {Object.entries(report.analysis).map(([key, section]) => (
                <div key={key} className="border rounded-xl p-4">
                  <h3 className="text-lg font-medium mb-2">{section.title}</h3>
                  <p className="whitespace-pre-line">{section.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {report.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <Badge variant="outline" className="mb-2 w-fit">Toimenpidesuositukset</Badge>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
              Suositukset arvon kasvattamiseksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.recommendations.map((recommendation, index) => (
                <div key={index} className="border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-1">
                      {recommendation.category || "Suositus"}
                    </Badge>
                    <div>
                      <h3 className="text-lg font-medium mb-1">{recommendation.title}</h3>
                      <p>{recommendation.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ValuationReport;
