import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Target, 
  TrendingUp, 
  FileBarChart, 
  PieChart, 
  Building, 
  LineChart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Import tab components
import ValuationOverviewTab from "./tabs/ValuationOverviewTab";
import ValuationMethodsTab from "./tabs/ValuationMethodsTab";
import SwotAndRiskTab from "./tabs/SwotAndRiskTab";
import CompanyAnalysisTab from "./tabs/CompanyAnalysisTab";
import EnhancedValuationSummary from "./EnhancedValuationSummary";
import { cleanMarkdownText } from "@/utils/markdownUtils";

// Tyyppimäärittelyt
interface ValuationTabsProps {
  valuationReport: any;
  financialAnalysis: any;
  companyInfo: any;
  latestPeriod: any;
  companyInfoAnalysis: any;
  swotData: any;
}

/**
 * Parannettu välilehtinäkymä arvonmääritysraportin esittämiseen - Refaktoroitu
 */
const ImprovedValuationTabs: React.FC<ValuationTabsProps> = ({
  valuationReport,
  financialAnalysis,
  companyInfo,
  latestPeriod,
  companyInfoAnalysis,
  swotData
}) => {
  const [activeTab, setActiveTab] = useState<string>("arvo-yhteenveto");

  return (
    <div className="mb-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="border border-indigo-100 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-4">
          <h2 className="text-xl font-bold text-white">Arvonmääritysraportti</h2>
          <p className="text-indigo-100 text-sm mt-1">
            Tekoälyn tuottama analyysi yrityksen arvosta ja suositukset arvon kehittämiseksi
          </p>
        </div>

        <TabsList className="w-full justify-start p-2 bg-indigo-50 border-b border-indigo-100">
          <TabsTrigger 
            value="arvo-yhteenveto" 
            className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <Target size={16} />
            <span className="hidden sm:inline">Arvon yhteenveto</span>
            <span className="sm:hidden">Yhteenveto</span>
          </TabsTrigger>

          <TabsTrigger 
            value="yritys" 
            className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <Building size={16} />
            <span>Yritys</span>
          </TabsTrigger>

          <TabsTrigger 
            value="talous" 
            className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <FileBarChart size={16} />
            <span>Talous</span>
          </TabsTrigger>

          <TabsTrigger 
            value="menetelmat" 
            className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <LineChart size={16} />
            <span className="hidden sm:inline">Arvostusmenetelmät</span>
            <span className="sm:hidden">Menetelmät</span>
          </TabsTrigger>

          <TabsTrigger 
            value="swot" 
            className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <PieChart size={16} />
            <span>SWOT</span>
          </TabsTrigger>

          <TabsTrigger 
            value="suositukset" 
            className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <TrendingUp size={16} />
            <span>Suositukset</span>
          </TabsTrigger>
        </TabsList>

        <div className="p-6 bg-white">
          {/* Arvon yhteenveto tab */}
          <TabsContent value="arvo-yhteenveto" className="mt-0">
            <ValuationOverviewTab 
              valuationReport={valuationReport}
              latestPeriod={latestPeriod}
            />
          </TabsContent>

          {/* Yritys tab */}
          <TabsContent value="yritys" className="mt-0">
            <CompanyAnalysisTab 
              companyInfo={companyInfo}
              companyInfoAnalysis={companyInfoAnalysis}
              valuationReport={valuationReport}
            />
          </TabsContent>

          {/* Talous tab */}
          <TabsContent value="talous" className="mt-0">
            <EnhancedValuationSummary 
              financialAnalysis={financialAnalysis} 
              companyInfo={companyInfo} 
            />

            {/* Taloudellinen suorituskyky */}
            {valuationReport?.analysis?.financial_performance?.content && (
              <div className="border border-green-100 rounded-xl p-6 bg-green-50 mt-6">
                <h3 className="text-lg font-semibold flex items-center mb-3">
                  <FileBarChart className="h-5 w-5 mr-2 text-green-600" />
                  {valuationReport.analysis.financial_performance.title || "Taloudellinen suorituskyky"}
                </h3>
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <p className="whitespace-pre-line">{cleanMarkdownText(valuationReport.analysis.financial_performance.content)}</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Arvostusmenetelmät tab */}
          <TabsContent value="menetelmat" className="mt-0">
            <ValuationMethodsTab 
              valuationReport={valuationReport}
              latestPeriod={latestPeriod}
            />
          </TabsContent>

          {/* SWOT tab */}
          <TabsContent value="swot" className="mt-0">
            <SwotAndRiskTab 
              valuationReport={valuationReport}
              swotData={swotData}
            />
          </TabsContent>

          {/* Suositukset tab */}
          <TabsContent value="suositukset" className="mt-0">
            {valuationReport?.recommendations && valuationReport.recommendations.length > 0 ? (
              <div className="space-y-6">
                <div className="border border-indigo-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold flex items-center mb-4">
                    <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                    Toimenpidesuositukset arvon kasvattamiseksi
                  </h3>

                  <div className="space-y-4">
                    {/* Group recommendations by category */}
                    {(() => {
                      const categorized: Record<string, any[]> = {};
                      valuationReport.recommendations.forEach((rec: any) => {
                        const category = rec.category || 'Muut suositukset';
                        if (!categorized[category]) categorized[category] = [];
                        categorized[category].push(rec);
                      });

                      return Object.entries(categorized).map(([category, recs], categoryIndex) => (
                        <div key={categoryIndex} className="space-y-3">
                          <h4 className="font-medium text-indigo-900 pb-1 border-b border-indigo-100">{category}</h4>

                          {recs.map((rec: any, recIndex: number) => (
                            <div key={recIndex} className="p-4 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-start gap-3">
                                <div className="bg-indigo-100 text-indigo-700 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {categoryIndex + 1}.{recIndex + 1}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-indigo-800">{cleanMarkdownText(rec.title)}</h5>
                                  <p className="mt-1 text-slate-600">{cleanMarkdownText(rec.description)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-indigo-100 rounded-xl p-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Toimenpidesuosituksia ei ole saatavilla tälle yritykselle.</p>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ImprovedValuationTabs;