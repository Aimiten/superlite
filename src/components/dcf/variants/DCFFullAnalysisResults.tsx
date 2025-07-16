import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart3, 
  Brain, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Shield,
  Target,
  DollarSign,
  FileText,
  Activity,
  Info
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
  Cell
} from 'recharts';

interface DCFFullAnalysisResultsProps {
  analysisData: DCFStructuredData;
}

export const DCFFullAnalysisResults: React.FC<DCFFullAnalysisResultsProps> = ({ analysisData }) => {
  const [selectedScenario, setSelectedScenario] = useState<'pessimistic' | 'base' | 'optimistic'>('base');
  
  if (!analysisData.valuation_summary || !analysisData.valuation_summary.probability_weighted_valuation) return null;

  const { equity_value_range, probability_weighted_valuation } = analysisData.valuation_summary;
  const scenario = analysisData.scenario_projections?.[selectedScenario];

  return (
    <div className="space-y-6">
      {/* Full DCF Specific Header */}
      <Alert className="border-success bg-success/10">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <strong>Täysi DCF-analyysi</strong>
              <Badge variant="default">Korkea luottamus ({analysisData.method_selector_decision?.confidence_score}/10)</Badge>
            </div>
            <p className="text-sm">
              3+ vuotta luotettavaa historiallista dataa. Analyysi perustuu vahvaan trendidataan ja yksityiskohtaisiin projektioihin.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full">
          <TabsTrigger value="overview">Yhteenveto</TabsTrigger>
          <TabsTrigger value="historical">Historia</TabsTrigger>
          <TabsTrigger value="projections">Projektiot</TabsTrigger>
          <TabsTrigger value="sensitivity">Herkkyys</TabsTrigger>
          <TabsTrigger value="details">Laskelmat</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                DCF Arvonmääritys - Täysi Analyysi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(equity_value_range.min)}
                  </div>
                  <div className="text-sm text-muted-foreground">Pessimistinen</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-info">
                    {formatCurrency(equity_value_range.base)}
                  </div>
                  <div className="text-sm text-muted-foreground">Base Case</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(equity_value_range.max)}
                  </div>
                  <div className="text-sm text-muted-foreground">Optimistinen</div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <div className="text-xl font-semibold mb-2">
                  Todennäköisyyspainotettu arvo
                </div>
                <div className="text-4xl font-bold text-secondary">
                  {formatCurrency(probability_weighted_valuation.weighted_equity_value)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  Painotus: 20% / 60% / 20%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* High Confidence Indicators */}
          <Card className="border-success">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Luotettavuusindikaattorit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-success/10 rounded">
                  <div className="text-2xl font-bold text-success">3+</div>
                  <div className="text-sm text-muted-foreground">Vuotta dataa</div>
                </div>
                <div className="text-center p-3 bg-success/10 rounded">
                  <div className="text-2xl font-bold text-success">
                    {analysisData.confidence_assessment?.overall_confidence_score}/10
                  </div>
                  <div className="text-sm text-muted-foreground">Luottamustaso</div>
                </div>
                <div className="text-center p-3 bg-success/10 rounded">
                  <div className="text-2xl font-bold text-success">Vahva</div>
                  <div className="text-sm text-muted-foreground">Trendianalyysi</div>
                </div>
                <div className="text-center p-3 bg-success/10 rounded">
                  <div className="text-2xl font-bold text-success">Korkea</div>
                  <div className="text-sm text-muted-foreground">Datan laatu</div>
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
                  Live Market Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Risk-free Rate</div>
                    <div className="font-semibold">
                      {(analysisData.historical_analysis.market_data_integration.riskFreeRate.value * 100).toFixed(2)}%
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {analysisData.historical_analysis.market_data_integration.riskFreeRate.source}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">EU Inflaatio</div>
                    <div className="font-semibold">
                      {(analysisData.historical_analysis.market_data_integration.inflation.value * 100).toFixed(2)}%
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {analysisData.historical_analysis.market_data_integration.inflation.source}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Industry Beta</div>
                    <div className="font-semibold">
                      {analysisData.historical_analysis.market_data_integration.industryBeta.value.toFixed(2)}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {analysisData.historical_analysis.market_data_integration.industryBeta.source}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Market WACC</div>
                    <div className="font-semibold">
                      {(analysisData.historical_analysis.market_data_integration.calculated_market_wacc * 100).toFixed(2)}%
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      Live Calculation
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="historical" className="space-y-6">
          {/* Historical Analysis with Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Historiallinen trendianalyysi (3+ vuotta)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisData.historical_analysis?.trends && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-sm text-muted-foreground">Liikevaihdon CAGR</div>
                    <div className="text-xl font-bold">
                      {(analysisData.historical_analysis.trends.revenue_cagr * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-sm text-muted-foreground">Keskim. EBITDA-%</div>
                    <div className="text-xl font-bold">
                      {(analysisData.historical_analysis.trends.ebitda_margin_avg * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-sm text-muted-foreground">Keskim. EBIT-%</div>
                    <div className="text-xl font-bold">
                      {(analysisData.historical_analysis.trends.ebit_margin_avg * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-sm text-muted-foreground">CapEx % liikevaihdosta</div>
                    <div className="text-xl font-bold">
                      {(analysisData.historical_analysis.trends.capex_avg_percent * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded">
                    <div className="text-sm text-muted-foreground">WC trendi</div>
                    <div className="text-xl font-bold">
                      {(analysisData.historical_analysis.trends.working_capital_trend * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Data Chart */}
              {analysisData.historical_analysis?.periods && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Historiallinen kehitys</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analysisData.historical_analysis.periods}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M€`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                        <Tooltip formatter={(value: any, name: string) => {
                          if (name.includes('%')) return `${(value * 100).toFixed(1)}%`;
                          return formatCurrency(value);
                        }} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--info))" name="Liikevaihto" strokeWidth={2} />
                        <Line yAxisId="left" type="monotone" dataKey="ebitda" stroke="hsl(var(--success))" name="EBITDA" strokeWidth={2} />
                        <Line yAxisId="left" type="monotone" dataKey="free_cash_flow" stroke="hsl(var(--secondary))" name="FCF" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry Benchmark Comparison */}
          {analysisData.historical_analysis?.industry_benchmark && (
            <Card>
              <CardHeader>
                <CardTitle>Toimialavertailu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">EBITDA-marginaali</span>
                      <span className="text-sm font-semibold">
                        Yritys: {(analysisData.historical_analysis.trends.ebitda_margin_avg * 100).toFixed(1)}% | 
                        Toimiala: {(analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_ebitda_margin * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative h-4 bg-muted rounded">
                      <div 
                        className="absolute h-full bg-info rounded" 
                        style={{width: `${Math.min(analysisData.historical_analysis.trends.ebitda_margin_avg / analysisData.historical_analysis.industry_benchmark.benchmark_metrics.avg_ebitda_margin * 50, 100)}%`}}
                      />
                      <div className="absolute h-full w-0.5 bg-muted-foreground" style={{left: '50%'}} />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {analysisData.historical_analysis.industry_benchmark.company_vs_industry.performance_assessment}
                  </div>
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

          {/* Detailed Projections */}
          {scenario && (
            <Card>
              <CardHeader>
                <CardTitle>5 vuoden projektiot - {
                  selectedScenario === 'base' ? 'Base Case' :
                  selectedScenario === 'pessimistic' ? 'Pessimistinen' : 'Optimistinen'
                }</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Metriikka</th>
                        <th className="text-right py-2">Vuosi 1</th>
                        <th className="text-right py-2">Vuosi 2</th>
                        <th className="text-right py-2">Vuosi 3</th>
                        <th className="text-right py-2">Vuosi 4</th>
                        <th className="text-right py-2">Vuosi 5</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2">Liikevaihto</td>
                        {scenario.projections.revenue.map((rev, idx) => (
                          <td key={idx} className="text-right">{formatCurrency(rev)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">Kasvu-%</td>
                        {scenario.assumptions.revenue_growth.map((growth, idx) => (
                          <td key={idx} className="text-right">{(growth * 100).toFixed(1)}%</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">EBITDA</td>
                        {scenario.projections.ebitda.map((ebitda, idx) => (
                          <td key={idx} className="text-right">{formatCurrency(ebitda)}</td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2">EBITDA-%</td>
                        {scenario.assumptions.ebitda_margin.map((margin, idx) => (
                          <td key={idx} className="text-right">{(margin * 100).toFixed(1)}%</td>
                        ))}
                      </tr>
                      <tr className="border-b font-semibold">
                        <td className="py-2">Vapaa kassavirta</td>
                        {scenario.projections.free_cash_flows.map((fcf, idx) => (
                          <td key={idx} className="text-right">{formatCurrency(fcf)}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sensitivity" className="space-y-6">
          {/* Sensitivity Analysis */}
          {analysisData.valuation_summary?.sensitivity_analysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Herkkyysanalyysi - Tornado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.valuation_summary.sensitivity_analysis.tornado_chart_data?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium">{item.parameter}</div>
                        <div className="flex-1">
                          <div className="h-8 bg-muted rounded relative overflow-hidden">
                            <div 
                              className="absolute h-full bg-gradient-to-r from-destructive to-success"
                              style={{
                                left: '50%',
                                width: `${Math.abs(item.percentage_impact) * 2}%`,
                                transform: item.percentage_impact < 0 ? 'translateX(-100%)' : 'translateX(0)'
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-20 text-sm text-right">
                          {item.percentage_impact > 0 ? '+' : ''}{(item.percentage_impact * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kriittiset parametrit</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Herkimmät muuttujat:</strong>
                      <ul className="mt-2 ml-4 list-disc">
                        {analysisData.valuation_summary.sensitivity_analysis.most_sensitive_parameters?.map((param, idx) => (
                          <li key={idx}>{param}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Detailed Calculations */}
          {scenario?.detailed_calculations && (
            <Card>
              <CardHeader>
                <CardTitle>Yksityiskohtaiset laskelmat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Vuosi</th>
                        <th className="text-right py-2">Liikevaihto</th>
                        <th className="text-right py-2">EBITDA</th>
                        <th className="text-right py-2">EBIT</th>
                        <th className="text-right py-2">NOPAT</th>
                        <th className="text-right py-2">CapEx</th>
                        <th className="text-right py-2">WC Δ</th>
                        <th className="text-right py-2">FCF</th>
                        <th className="text-right py-2">PV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenario.detailed_calculations.yearly_breakdown.map((year, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted">
                          <td className="py-2">{year.year}</td>
                          <td className="text-right">{formatCurrency(year.revenue)}</td>
                          <td className="text-right">
                            {formatCurrency(year.ebitda)}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({(year.ebitda_margin * 100).toFixed(1)}%)
                            </span>
                          </td>
                          <td className="text-right">{formatCurrency(year.ebit)}</td>
                          <td className="text-right">{formatCurrency(year.nopat)}</td>
                          <td className="text-right text-destructive">-{formatCurrency(year.capex)}</td>
                          <td className="text-right text-destructive">-{formatCurrency(year.working_capital_change)}</td>
                          <td className="text-right font-semibold">{formatCurrency(year.free_cash_flow)}</td>
                          <td className="text-right">{formatCurrency(year.present_value_fcf)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Valuation Bridge */}
                {scenario.detailed_calculations.valuation_bridge && (
                  <div className="mt-6 p-4 bg-muted rounded">
                    <h4 className="font-semibold mb-3">Arvostussilta</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Kassavirtojen nykyarvo</span>
                        <span>{formatCurrency(scenario.detailed_calculations.valuation_bridge.sum_pv_fcf)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Terminaaliarvon nykyarvo</span>
                        <span>{formatCurrency(scenario.detailed_calculations.valuation_bridge.terminal_pv)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>= Yritysarvo (EV)</span>
                        <span>{formatCurrency(scenario.detailed_calculations.valuation_bridge.enterprise_value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>- Nettovelka</span>
                        <span>{formatCurrency(scenario.detailed_calculations.valuation_bridge.net_debt)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold text-base">
                        <span>= Oman pääoman arvo</span>
                        <span>{formatCurrency(scenario.detailed_calculations.valuation_bridge.equity_value)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};