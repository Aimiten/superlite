
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  TrendingUp, 
  LightbulbIcon, 
  CheckSquare 
} from "lucide-react";
import { AnalysisResults } from "@/components/assessment/types";

interface AnalysisResultsCardProps {
  analysisResults?: AnalysisResults | null;
}

const AnalysisResultsCard: React.FC<AnalysisResultsCardProps> = ({ 
  analysisResults 
}) => {
  if (!analysisResults) {
    return (
      <Card className="card-3d">
        <CardHeader>
          <CardTitle>Analyysi ei saatavilla</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Analyysin tietoja ei löydy tai analyysia ei ole vielä suoritettu.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-3d">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-500" />
          Myyntikuntoisuuden analyysi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {analysisResults.key_points && (
          <div className="rounded-lg bg-purple-50 p-4 border border-purple-100">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LightbulbIcon className="h-5 w-5 text-purple-500" />
              {analysisResults.key_points.title || "Keskeiset havainnot"}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {analysisResults.key_points.content}
            </p>
          </div>
        )}

        {/* Yrityksen analyysiosiot - valinmäärityksen analyysi */}
        {analysisResults.valuation_analysis && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Arvonmäärityksen analyysi</h3>
            
            {analysisResults.valuation_analysis.substanssi_analysis && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{analysisResults.valuation_analysis.substanssi_analysis.title}</h4>
                <p className="text-gray-700 whitespace-pre-line">{analysisResults.valuation_analysis.substanssi_analysis.content}</p>
              </div>
            )}
            
            {analysisResults.valuation_analysis.ev_ebit_analysis && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{analysisResults.valuation_analysis.ev_ebit_analysis.title}</h4>
                <p className="text-gray-700 whitespace-pre-line">{analysisResults.valuation_analysis.ev_ebit_analysis.content}</p>
              </div>
            )}
          </div>
        )}

        {/* Yrityskohtaiset havainnot */}
        {analysisResults.company_insights && analysisResults.company_insights.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Yrityskohtaiset havainnot</h3>
            {analysisResults.company_insights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{insight.title}</h4>
                <p className="text-gray-700 whitespace-pre-line">{insight.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* MYYNTIKUNTOON-palvelun suositus erikseen korostettuna */}
        {analysisResults.myyntikuntoon_recommendation && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              {analysisResults.myyntikuntoon_recommendation.title}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {analysisResults.myyntikuntoon_recommendation.description}
            </p>
          </div>
        )}

        {analysisResults.analysis_sections && analysisResults.analysis_sections.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Yksityiskohtainen analyysi</h3>
            {analysisResults.analysis_sections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{section.title}</h4>
                <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>
        )}

        {analysisResults.sale_readiness_growth_path && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Myyntikuntoisuuden kehityspolku
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Seuraavat toimenpiteet</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResults.sale_readiness_growth_path.next_steps.map((step, index) => (
                    <li key={index} className="text-gray-700">{step}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Keskipitkän aikavälin toimenpiteet</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {analysisResults.sale_readiness_growth_path.medium_term_actions.map((action, index) => (
                    <li key={index} className="text-gray-700">{action}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Odotetut tulokset</h4>
                <p className="text-gray-700 whitespace-pre-line">
                  {analysisResults.sale_readiness_growth_path.expected_outcomes}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Muut toimenpidesuositukset */}
        {analysisResults.additional_recommendations && analysisResults.additional_recommendations.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              Toimenpidesuositukset
            </h3>
            
            <div className="space-y-3">
              {analysisResults.additional_recommendations.map((recommendation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <h4 className="font-medium text-lg">{recommendation.title}</h4>
                      <p className="text-gray-700 mt-1 whitespace-pre-line">{recommendation.description}</p>
                      
                      {recommendation.expected_impact && (
                        <div className="mt-3 pt-3 border-t border-dashed">
                          <p className="text-sm font-medium">Odotettu vaikutus:</p>
                          <p className="text-sm text-gray-600">{recommendation.expected_impact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Näytetään vanhat suositukset jos ei ole additional_recommendations mutta on recommendations */}
        {!analysisResults.additional_recommendations && analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              Toimenpidesuositukset
            </h3>
            
            <div className="space-y-3">
              {analysisResults.recommendations.map((recommendation, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <Badge variant={recommendation.priority === "korkea" ? "destructive" : 
                                 recommendation.priority === "keskitaso" ? "default" : "outline"} 
                          className="mb-2">
                        {recommendation.priority === "korkea" ? "Korkea prioriteetti" : 
                         recommendation.priority === "keskitaso" ? "Keskitaso" : "Matala prioriteetti"}
                      </Badge>
                      <h4 className="font-medium text-lg">{recommendation.title}</h4>
                      <p className="text-gray-700 mt-1 whitespace-pre-line">{recommendation.description}</p>
                      
                      {recommendation.expected_impact && (
                        <div className="mt-3 pt-3 border-t border-dashed">
                          <p className="text-sm font-medium">Odotettu vaikutus:</p>
                          <p className="text-sm text-gray-600">{recommendation.expected_impact}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisResultsCard;
