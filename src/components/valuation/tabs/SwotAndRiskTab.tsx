import React from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cleanMarkdownText } from "@/utils/markdownUtils";

interface SwotAndRiskTabProps {
  valuationReport: any;
  swotData: any;
}

const SwotAndRiskTab: React.FC<SwotAndRiskTabProps> = ({
  valuationReport,
  swotData
}) => {
  return (
    <div className="space-y-6">
      <div className="border border-indigo-100 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">SWOT-analyysi</h3>

        {swotData && (Object.keys(swotData).some(key => swotData[key])) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {swotData.strengths && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-green-800">Vahvuudet</h4>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">S</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.strengths.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-green-700">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {swotData.weaknesses && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-red-800">Heikkoudet</h4>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">W</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.weaknesses.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-red-100 text-red-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-red-700">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {swotData.opportunities && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-blue-800">Mahdollisuudet</h4>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">O</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.opportunities.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-blue-100 text-blue-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-blue-700">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {swotData.threats && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-amber-800">Uhat</h4>
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">T</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.threats.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-amber-100 text-amber-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-amber-700">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500">SWOT-analyysia ei ole saatavilla tälle yritykselle.</p>
          </div>
        )}
      </div>

      {/* Riskiarviointi */}
      {valuationReport?.analysis?.risk_assessment?.content && (
        <div className="border border-amber-100 rounded-xl p-6 bg-amber-50">
          <h3 className="text-lg font-semibold flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
            {valuationReport.analysis.risk_assessment.title || "Riskiarviointi"}
          </h3>
          <div className="bg-white p-4 rounded-lg border border-amber-100">
            <p className="whitespace-pre-line">{cleanMarkdownText(valuationReport.analysis.risk_assessment.content)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwotAndRiskTab;