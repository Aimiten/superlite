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
  Rocket,
  Target,
  DollarSign,
  Clock,
  Zap,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { DCFStructuredData } from '@/types/dcf-analysis';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell
} from 'recharts';

interface DCFForwardLookingAnalysisResultsProps {
  analysisData: DCFStructuredData;
}

export const DCFForwardLookingAnalysisResults: React.FC<DCFForwardLookingAnalysisResultsProps> = ({ analysisData }) => {
  const [selectedScenario, setSelectedScenario] = useState<'pessimistic' | 'base' | 'optimistic'>('base');
  
  if (!analysisData.valuation_summary || !analysisData.valuation_summary.probability_weighted_valuation) return null;

  const { equity_value_range, probability_weighted_valuation } = analysisData.valuation_summary;
  const scenario = analysisData.scenario_projections?.[selectedScenario];

  // Startup metrics for radar chart
  const startupMetrics = [
    { metric: 'Markkinapotentiaali', value: 80 },
    { metric: 'Tiimin kokemus', value: 60 },
    { metric: 'Teknologia', value: 75 },
    { metric: 'Liiketoimintamalli', value: 70 },
    { metric: 'Skaalautuvuus', value: 85 },
    { metric: 'Kilpailuetu', value: 65 }
  ];

  // Market penetration visualization
  const marketPenetrationData = analysisData.revenue_projections?.market_size_analysis?.penetration_assumptions?.map((pen, idx) => ({
    year: `Vuosi ${idx + 1}`,
    penetration: pen * 100,
    tam: analysisData.revenue_projections?.market_size_analysis?.total_addressable_market || 0,
    sam: analysisData.revenue_projections?.market_size_analysis?.serviceable_addressable_market || 0,
    revenue: scenario?.projections.revenue[idx] || 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Forward Looking DCF Specific Header */}
      <Alert className="border-orange-200 bg-orange-50">
        <Rocket className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <strong>Eteenpäin katsova DCF-analyysi</strong>
              <Badge variant="destructive">Matala luottamus ({analysisData.method_selector_decision?.confidence_score}/10)</Badge>
            </div>
            <p className="text-sm">
              1-2 vuotta historiallista dataa. Startup/kasvuvaihe. Projektiot perustuvat markkinapotentiaaliin ja skenaarioanalyysiin.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Critical Warning */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Kriittinen varoitus</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 ml-4 list-disc text-sm">
            <li>DCF EI ole ensisijainen menetelmä startup-yrityksille</li>
            <li>Erittäin korkea epävarmuus projektiossa</li>
            <li>Käytä AINA täydentäviä menetelmiä (Berkus, VC Method, First Chicago)</li>
            <li>Todellinen arvo riippuu täysin toteutuksesta</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6 w-full">
          <TabsTrigger value="overview">Yhteenveto</TabsTrigger>
          <TabsTrigger value="startup">Startup-analyysi</TabsTrigger>
          <TabsTrigger value="market">Markkinapotentiaali</TabsTrigger>
          <TabsTrigger value="projections">Skenaariot</TabsTrigger>
          <TabsTrigger value="risks">Riskit</TabsTrigger>
          <TabsTrigger value="alternatives">Vaihtoehdot</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary with Startup Context */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                DCF Arvonmääritys - Startup/Kasvuyritys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 bg-orange-50 border-orange-300">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Arvostus perustuu aggressiivisiin kasvuoletuksiin ja markkinapotentiaaliin. 
                  Todellinen arvo riippuu yrityksen kyvystä toteuttaa kasvustrategia.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(equity_value_range.min)}
                  </div>
                  <div className="text-sm text-gray-600">Pessimistinen (30%)</div>
                  <div className="text-xs text-gray-500 mt-1">Hitaampi markkinapenetraatio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(equity_value_range.base)}
                  </div>
                  <div className="text-sm text-gray-600">Base Case (40%)</div>
                  <div className="text-xs text-gray-500 mt-1">Odotettu kasvupolku</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(equity_value_range.max)}
                  </div>
                  <div className="text-sm text-gray-600">Optimistinen (30%)</div>
                  <div className="text-xs text-gray-500 mt-1">Nopea skaalautuminen</div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="text-center">
                <div className="text-xl font-semibold mb-2">
                  Todennäköisyyspainotettu arvo
                </div>
                <div className="text-4xl font-bold text-purple-600">
                  {formatCurrency(probability_weighted_valuation.weighted_equity_value)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Painotus: 30% / 40% / 30% (Adjusted for startup risk)
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Startup Stage Indicator */}
          {analysisData.methodology_assessment && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Yrityksen vaihe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {analysisData.methodology_assessment.company_stage}
                    </div>
                    <div className="text-sm text-gray-600">Vaihe</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {analysisData.methodology_assessment.business_model}
                    </div>
                    <div className="text-sm text-gray-600">Malli</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {analysisData.startup_analysis?.data_quality.periods_available || 1}-2
                    </div>
                    <div className="text-sm text-gray-600">Vuotta dataa</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      {analysisData.methodology_assessment.dcf_suitability_score}/10
                    </div>
                    <div className="text-sm text-gray-600">DCF soveltuvuus</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="startup" className="space-y-6">
          {/* Startup Metrics Analysis */}
          {analysisData.startup_analysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Startup-metriikat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Burn Rate & Runway */}
                    <div>
                      <h4 className="font-semibold mb-4">Kassavirta & Runway</h4>
                      {analysisData.startup_analysis.growth_metrics && (
                        <div className="space-y-4">
                          {analysisData.startup_analysis.growth_metrics.burn_rate && (
                            <div className="p-4 bg-red-50 rounded">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm text-gray-600">Burn Rate</div>
                                  <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(analysisData.startup_analysis.growth_metrics.burn_rate)}/kk
                                  </div>
                                </div>
                                <DollarSign className="h-8 w-8 text-red-400" />
                              </div>
                            </div>
                          )}
                          {analysisData.startup_analysis.growth_metrics.runway_months && (
                            <div className="p-4 bg-orange-50 rounded">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-sm text-gray-600">Runway</div>
                                  <div className="text-2xl font-bold text-orange-600">
                                    {analysisData.startup_analysis.growth_metrics.runway_months} kk
                                  </div>
                                </div>
                                <Clock className="h-8 w-8 text-orange-400" />
                              </div>
                              <Progress 
                                value={(analysisData.startup_analysis.growth_metrics.runway_months / 24) * 100} 
                                className="mt-2"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                {analysisData.startup_analysis.growth_metrics.runway_months < 12 
                                  ? 'Rahoitustarve lähiaikoina!' 
                                  : 'Riittävä runway'}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Startup Assessment Radar */}
                    <div>
                      <h4 className="font-semibold mb-4">Startup-arviointi</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={startupMetrics}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} />
                            <Radar 
                              name="Arviointi" 
                              dataKey="value" 
                              stroke="#8b5cf6" 
                              fill="#8b5cf6" 
                              fillOpacity={0.6} 
                            />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Data Quality Warning */}
                  {analysisData.startup_analysis.data_quality && (
                    <Alert className="mt-6 bg-orange-50 border-orange-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Datan laatu:</strong> {analysisData.startup_analysis.data_quality.data_reliability}
                        <br />
                        <strong>Projektioiden perusta:</strong> {analysisData.startup_analysis.data_quality.projection_basis}
                        <br />
                        <strong>Luottamustaso:</strong> {analysisData.startup_analysis.data_quality.confidence_level}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Growth Metrics */}
              {analysisData.startup_analysis.growth_metrics?.customer_acquisition_rate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kasvumetriikat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-green-50 rounded">
                        <div className="text-sm text-gray-600">CAC</div>
                        <div className="font-semibold">
                          {formatCurrency(analysisData.startup_analysis.growth_metrics.customer_acquisition_rate)}
                        </div>
                      </div>
                      {analysisData.startup_analysis.growth_metrics.revenue_per_customer && (
                        <div className="p-3 bg-blue-50 rounded">
                          <div className="text-sm text-gray-600">Revenue/Customer</div>
                          <div className="font-semibold">
                            {formatCurrency(analysisData.startup_analysis.growth_metrics.revenue_per_customer)}
                          </div>
                        </div>
                      )}
                      <div className="p-3 bg-purple-50 rounded">
                        <div className="text-sm text-gray-600">Vaihe</div>
                        <div className="font-semibold">
                          {analysisData.startup_analysis.company_stage}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          {/* Market Size Analysis */}
          {analysisData.revenue_projections?.market_size_analysis && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Markkinapotentiaali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded">
                      <div className="text-3xl font-bold text-blue-600">
                        {formatCurrency(analysisData.revenue_projections.market_size_analysis.total_addressable_market)}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">TAM</div>
                      <div className="text-xs text-gray-500">Total Addressable Market</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded">
                      <div className="text-3xl font-bold text-green-600">
                        {formatCurrency(analysisData.revenue_projections.market_size_analysis.serviceable_addressable_market)}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">SAM</div>
                      <div className="text-xs text-gray-500">Serviceable Addressable Market</div>
                    </div>
                    <div className="text-center p-6 bg-purple-50 rounded">
                      <div className="text-3xl font-bold text-purple-600">
                        {formatCurrency(scenario?.projections.revenue[4] || 0)}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">SOM (Year 5)</div>
                      <div className="text-xs text-gray-500">Serviceable Obtainable Market</div>
                    </div>
                  </div>

                  {/* Market Penetration Chart */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">Markkinapenetraatio-oletus</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marketPenetrationData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis yAxisId="left" tickFormatter={(value) => `${value}%`} />
                          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M€`} />
                          <Tooltip />
                          <Legend />
                          <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="penetration" 
                            stroke="#8b5cf6" 
                            fill="#8b5cf6" 
                            fillOpacity={0.6}
                            name="Markkinaosuus %"
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            name="Liikevaihto"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Growth Assumptions */}
              <Card>
                <CardHeader>
                  <CardTitle>Kasvuoletukset</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4 bg-purple-50 border-purple-200">
                    <Rocket className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Startup-yrityksen projektiot perustuvat markkinan kokoon ja oletettuun penetraatiovauhtiin, 
                      ei historialliseen dataan.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Vuosi 1 penetraatio</span>
                        <span className="font-semibold">
                          {((marketPenetrationData[0]?.penetration || 0)).toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={marketPenetrationData[0]?.penetration || 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Vuosi 5 penetraatio</span>
                        <span className="font-semibold">
                          {((marketPenetrationData[4]?.penetration || 0)).toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={marketPenetrationData[4]?.penetration || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          {/* Scenario Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Valitse skenaario</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 bg-orange-50 border-orange-200">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Startup-yrityksillä skenaarioiden väliset erot ovat erityisen suuria johtuen korkeasta epävarmuudesta.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button 
                  variant={selectedScenario === 'pessimistic' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('pessimistic')}
                  className="flex-1"
                >
                  <div>
                    <div>Pessimistinen</div>
                    <div className="text-xs font-normal">Hidas kasvu</div>
                  </div>
                </Button>
                <Button 
                  variant={selectedScenario === 'base' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('base')}
                  className="flex-1"
                >
                  <div>
                    <div>Base Case</div>
                    <div className="text-xs font-normal">Odotettu</div>
                  </div>
                </Button>
                <Button 
                  variant={selectedScenario === 'optimistic' ? 'default' : 'outline'}
                  onClick={() => setSelectedScenario('optimistic')}
                  className="flex-1"
                >
                  <div>
                    <div>Optimistinen</div>
                    <div className="text-xs font-normal">Hockey stick</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Growth Trajectory */}
          {scenario && (
            <Card>
              <CardHeader>
                <CardTitle>Kasvupolku - {
                  selectedScenario === 'base' ? 'Base Case' :
                  selectedScenario === 'pessimistic' ? 'Hidas kasvu' : 'Hockey stick'
                }</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scenario.projections.revenue.map((rev, idx) => ({
                      year: `Vuosi ${idx + 1}`,
                      revenue: rev,
                      growth: idx > 0 ? ((rev - scenario.projections.revenue[idx-1]) / scenario.projections.revenue[idx-1] * 100) : 0
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis yAxisId="left" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M€`} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value: any, name: string) => {
                        if (name === 'Kasvu-%') return `${value.toFixed(1)}%`;
                        return formatCurrency(value);
                      }} />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        name="Liikevaihto"
                        dot={{ r: 6 }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="growth" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Kasvu-%"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Key Assumptions */}
                <div className="mt-6 p-4 bg-gray-50 rounded">
                  <h4 className="font-semibold mb-3">Keskeiset oletukset</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Keskim. kasvu</div>
                      <div className="font-semibold">
                        {(scenario.assumptions.revenue_growth.reduce((a, b) => a + b, 0) / scenario.assumptions.revenue_growth.length * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">WACC</div>
                      <div className="font-semibold text-orange-600">
                        {(scenario.assumptions.wacc * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-orange-500">+Startup premium</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Terminal kasvu</div>
                      <div className="font-semibold">
                        {(scenario.assumptions.terminal_growth * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Exit vuosi</div>
                      <div className="font-semibold">5-7v</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          {/* High Risk Factors */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Korkeat riskit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.risk_analysis?.high_risks?.map((risk, idx) => (
                  <Alert key={idx} className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{risk}</AlertDescription>
                  </Alert>
                ))}
                
                {/* Startup-specific risks */}
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Rahoitusriski:</strong> Yritys tarvitsee lisärahoitusta seuraavan 12-18 kuukauden aikana
                  </AlertDescription>
                </Alert>
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Markkinariski:</strong> Markkinan hyväksyntä ja kasvunopeus ovat epävarmoja
                  </AlertDescription>
                </Alert>
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Toteutusriski:</strong> Tiimin kyky skaalata liiketoimintaa on testaamaton
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Risk Mitigation */}
          <Card>
            <CardHeader>
              <CardTitle>Riskinhallintatoimenpiteet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysisData.risk_analysis?.risk_mitigation?.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-6">
          {/* Alternative Valuation Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Suositellut vaihtoehtoiset menetelmät
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 bg-orange-50 border-orange-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>TÄRKEÄ:</strong> DCF ei ole paras menetelmä startup-yrityksille. 
                  Käytä AINA vähintään 2-3 alla olevista menetelmistä DCF:n rinnalla.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                {analysisData.methodology_assessment?.alternative_methods_recommended?.map((method, idx) => (
                  <Card key={idx} className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold">{method}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {method.includes('Berkus') && 'Perustuu laadullisiin tekijöihin, sopii pre-revenue yrityksille'}
                            {method.includes('VC Method') && 'Perustuu exit-arvoon ja tuottovaatimukseen'}
                            {method.includes('First Chicago') && 'Yhdistää kolme skenaariota todennäköisyyksillä'}
                            {method.includes('Scorecard') && 'Vertaa muihin rahoitusta saaneisiin startupeihin'}
                            {method.includes('Risk Factor') && 'Säätää arvoa riskitekijöiden perusteella'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recommended Approach */}
              <div className="mt-6 p-4 bg-green-50 rounded">
                <h4 className="font-semibold mb-2">Suositeltu lähestymistapa</h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Käytä DCF:ää vain yhtenä näkökulmana, ei ensisijaisena menetelmänä</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Painota VC Method tai First Chicago -menetelmää enemmän</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Vertaa tuloksia vastaavan vaiheen yritysten transaktiohintoihin</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">4.</span>
                    <span>Päivitä arvostus säännöllisesti uuden datan myötä</span>
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Exit Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Exit-skenaariot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded">
                  <h4 className="font-semibold mb-2">Trade Sale (5-7v)</h4>
                  <p className="text-sm text-gray-600">
                    Strateginen ostaja, tyypillisesti 3-8x liikevaihtokerroin riippuen kasvusta ja kannattavuudesta
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded">
                  <h4 className="font-semibold mb-2">Financial Exit (7-10v)</h4>
                  <p className="text-sm text-gray-600">
                    PE-rahasto, tyypillisesti 8-15x EBITDA riippuen kasvusta ja markkinasta
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <h4 className="font-semibold mb-2">IPO (10v+)</h4>
                  <p className="text-sm text-gray-600">
                    Pörssilistautuminen, vaatii merkittävää kokoa ja vakaata kasvua
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};