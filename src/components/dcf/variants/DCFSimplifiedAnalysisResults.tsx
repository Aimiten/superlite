import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, 
  Brain, 
  AlertCircle,
  TrendingUp,
  Calculator,
  Info,
  Database,
  Scale,
  ChartBar
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DCFStructuredData } from '@/types/dcf-analysis';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DCFSimplifiedAnalysisResultsProps {
  analysisData: DCFStructuredData;
}

export const DCFSimplifiedAnalysisResults: React.FC<DCFSimplifiedAnalysisResultsProps> = ({ analysisData }) => {
  const [selectedScenario, setSelectedScenario] = useState<'pessimistic' | 'base' | 'optimistic'>('base');
  
  if (!analysisData.valuation_summary || !analysisData.valuation_summary.probability_weighted_valuation) return null;

  const { equity_value_range, probability_weighted_valuation } = analysisData.valuation_summary;
  const scenario = analysisData.scenario_projections?.[selectedScenario];

  // Data source breakdown for pie chart
  const dataSourceBreakdown = [
    { name: 'Toimiala-benchmarkit', value: 70, color: '#3B82F6' },
    { name: 'Yrityksen data', value: 30, color: '#10B981' }
  ];

  return (
    <div className="space-y-6">
      {/* Simplified DCF Specific Header */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <strong>Yksinkertaistettu DCF-analyysi</strong>
              <Badge variant="secondary">Keskitason luottamus ({analysisData.method_selector_decision?.confidence_score}/10)</Badge>
            </div>
            <p className="text-sm">
              2-3 vuotta historiallista dataa. Analyysi täydennetty toimialan benchmarkeilla datan rajallisuuden vuoksi.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Data Limitations Warning */}
      <Alert className="border-orange-200 bg-orange-50">
        <Info className="h-4 w-4" />
        <AlertTitle>Datan rajoitteet</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 ml-4 list-disc text-sm">
            <li>Rajoitettu historiallinen data (2-3 vuotta)</li>
            <li>WACC:iin lisätty +1pp riskipreemio datan puutteen vuoksi</li>
            <li>Projektiot perustuvat 70% toimialan keskiarvoihin</li>
            <li>Suositellaan täydentäviä arvonmääritysmenetelmiä</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
          <TabsTrigger value="overview">Yhteenveto</TabsTrigger>
          <TabsTrigger value="data-sources">Datalähteet</TabsTrigger>
          <TabsTrigger value="benchmarks">Vertailut</TabsTrigger>
          <TabsTrigger value="projections">Projektiot</TabsTrigger>
          <TabsTrigger value="limitations">Rajoitteet</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary with Wider Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                DCF Arvonmääritys - Yksinkertaistettu Analyysi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(equity_value_range.min)}
                  </div>
                  <div className="text-sm text-gray-600">Pessimistinen (-30%)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(equity_value_range.base)}
                  </div>
                  <div className="text-sm text-gray-600">Base Case</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(equity_value_range.max)}
                  </div>
                  <div className="text-sm text-gray-600">Optimistinen (+30%)</div>
                </div>
              </div>
              
              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Arvostusväli on tavallista laajempi rajoitetun datan vuoksi. Todellinen arvo riippuu vahvasti tulevaisuuden kehityksestä.
                </AlertDescription>
              </Alert>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <div className="text-xl font-semibold mb-2">
                  Todennäköisyyspainotettu arvo
                </div>
                <div className="text-4xl font-bold text-purple-600">
                  {formatCurrency(probability_weighted_valuation.weighted_equity_value)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Painotus: 20% / 60% / 20%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Data Integration */}
          {analysisData.historical_analysis?.market_data_integration && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Live Market Data + Industry Benchmarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Risk-free Rate</div>
                    <div className="font-semibold">
                      {(analysisData.historical_analysis.market_data_integration.riskFreeRate.value * 100).toFixed(2)}%
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {analysisData.historical_analysis.market_data_integration.riskFreeRate.source}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Adjusted WACC</div>
                    <div className="font-semibold text-orange-600">
                      {((analysisData.historical_analysis.market_data_integration.calculated_market_wacc + 0.01) * 100).toFixed(2)}%
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      +1pp Risk Premium
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Industry Beta</div>
                    <div className="font-semibold">
                      {analysisData.historical_analysis.market_data_integration.industryBeta.value.toFixed(2)}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {analysisData.historical_analysis.market_data_integration.industryBeta.source}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Data Quality</div>
                    <div className="font-semibold text-yellow-600">
                      Rajoitettu
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      2-3 vuotta
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="data-sources" className="space-y-6">
          {/* Data Source Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Datalähdeanalyysi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">Datan koostumus</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataSourceBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {dataSourceBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Käytetyt toimiala-benchmarkit</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="flex justify-between">
                        <span className="text-sm">EBITDA-marginaali</span>
                        <span className="font-semibold">
                          {analysisData.historical_analysis?.industry_benchmark?.benchmark_metrics.avg_ebitda_margin 
                            ? `${(analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_ebitda_margin * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="flex justify-between">
                        <span className="text-sm">Kasvuvauhti</span>
                        <span className="font-semibold">
                          {analysisData.historical_analysis?.industry_benchmark?.benchmark_metrics.avg_revenue_growth
                            ? `${(analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_revenue_growth * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="flex justify-between">
                        <span className="text-sm">CapEx %</span>
                        <span className="font-semibold">
                          {analysisData.historical_analysis?.industry_benchmark?.benchmark_metrics.avg_capex_percent
                            ? `${(analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_capex_percent * 100).toFixed(1)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="mt-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Projektiot perustuvat vahvasti toimialan keskiarvoihin yrityksen lyhyen historian vuoksi.
                  Tämä lähestymistapa vähentää yksittäisten poikkeamavuosien vaikutusta.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Limited Historical Data */}
          <Card>
            <CardHeader>
              <CardTitle>Käytettävissä oleva historiadata</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.historical_analysis?.data_quality && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Datapisteitä käytettävissä</span>
                    <Badge variant="outline">
                      {analysisData.historical_analysis.data_quality.periods_available} vuotta
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Datan luotettavuus</span>
                    <Badge variant="secondary">
                      {analysisData.historical_analysis.data_quality.data_reliability}
                    </Badge>
                  </div>
                  {analysisData.historical_analysis.data_quality.key_limitations?.map((limitation, idx) => (
                    <Alert key={idx} className="bg-orange-50 border-orange-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{limitation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          {/* Industry Comparison */}
          {analysisData.historical_analysis?.industry_benchmark && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Yritys vs. Toimiala
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Performance Metrics Comparison */}
                  <div>
                    <h4 className="font-semibold mb-4">Keskeisten tunnuslukujen vertailu</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">EBITDA-marginaali</span>
                          <span className="text-sm">
                            Yritys: {analysisData.historical_analysis.trends?.ebitda_margin_avg 
                              ? `${(analysisData.historical_analysis.trends.ebitda_margin_avg * 100).toFixed(1)}%` 
                              : 'N/A'} | 
                            Toimiala: {(analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_ebitda_margin * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={analysisData.historical_analysis.trends?.ebitda_margin_avg 
                            ? (analysisData.historical_analysis.trends.ebitda_margin_avg / analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_ebitda_margin * 100)
                            : 0} 
                          className="h-3"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">Liikevaihdon kasvu</span>
                          <span className="text-sm">
                            Yritys: {analysisData.historical_analysis.trends?.revenue_cagr
                              ? `${(analysisData.historical_analysis.trends.revenue_cagr * 100).toFixed(1)}%`
                              : 'N/A'} | 
                            Toimiala: {(analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_revenue_growth * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={analysisData.historical_analysis.trends?.revenue_cagr
                            ? (analysisData.historical_analysis.trends.revenue_cagr / analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_revenue_growth * 100)
                            : 0} 
                          className="h-3"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Assessment */}
                  <Alert>
                    <ChartBar className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Toimialavertailu:</strong> {analysisData.historical_analysis.industry_benchmark.company_vs_industry.performance_assessment}
                    </AlertDescription>
                  </Alert>

                  {/* Comparable Companies */}
                  {analysisData.historical_analysis.industry_benchmark.comparable_companies?.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Vertailukelpoiset yritykset</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisData.historical_analysis.industry_benchmark.comparable_companies.map((company, idx) => (
                          <Badge key={idx} variant="outline">{company}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          {/* Scenario Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Valitse skenaario</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant={selectedScenario === 'pessimistic' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('pessimistic')}
                  className="flex-1"
                >
                  Pessimistinen
                </Button>
                <Button 
                  variant={selectedScenario === 'base' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('base')}
                  className="flex-1"
                >
                  Base Case
                </Button>
                <Button 
                  variant={selectedScenario === 'optimistic' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('optimistic')}
                  className="flex-1"
                >
                  Optimistinen
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Simplified Projections */}
          {scenario && (
            <Card>
              <CardHeader>
                <CardTitle>Benchmark-pohjaiset projektiot</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Projektiot perustuvat 70% toimialan keskiarvoihin ja 30% yrityksen omaan dataan.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-4">Liikevaihdon kehitys</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scenario.projections.revenue.map((rev, idx) => ({
                          year: `Vuosi ${idx + 1}`,
                          revenue: rev,
                          growth: scenario.assumptions.revenue_growth[idx] * 100
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M€`} />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Kassavirran kehitys</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={scenario.projections.free_cash_flows.map((fcf, idx) => ({
                          year: `Vuosi ${idx + 1}`,
                          fcf: fcf
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`} />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Bar dataKey="fcf" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="limitations" className="space-y-6">
          {/* Methodology Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Metodologian rajoitteet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.methodology_assessment?.dcf_limitations?.map((limitation, idx) => (
                  <Alert key={idx} className="bg-orange-50 border-orange-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{limitation}</AlertDescription>
                  </Alert>
                ))}
              </div>

              {/* Alternative Methods */}
              {analysisData.methodology_assessment?.alternative_methods_recommended && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">Suositellut täydentävät menetelmät</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {analysisData.methodology_assessment.alternative_methods_recommended.map((method, idx) => (
                      <Card key={idx} className="border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">{method}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence Assessment */}
              <div className="mt-6 p-4 bg-yellow-50 rounded">
                <h4 className="font-semibold mb-2">Luotettavuusarvio</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Kokonaisluottamus</span>
                    <span className="font-semibold">
                      {analysisData.confidence_assessment?.overall_confidence_score}/10
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>DCF-soveltuvuus</span>
                    <span className="font-semibold">
                      {analysisData.methodology_assessment?.dcf_suitability_score}/10
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Suositellut toimenpiteet</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                  <span>Käytä DCF-tulosta yhdessä muiden menetelmien kanssa</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                  <span>Päivitä analyysi kun lisää historiallista dataa on saatavilla</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                  <span>Kiinnitä erityistä huomiota herkkyysanalyysiin</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                  <span>Vertaa tuloksia toimialan transaktiohintoihin</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};