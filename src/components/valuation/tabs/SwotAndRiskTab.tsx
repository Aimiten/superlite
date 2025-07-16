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
      <div className="border border-primary/20 rounded-xl p-6 shadow-neumorphic">
        <h3 className="text-lg font-semibold mb-4">SWOT-analyysi</h3>

        {swotData && (Object.keys(swotData).some(key => swotData[key])) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {swotData.strengths && (
              <div className="p-4 bg-success/10 rounded-lg border border-success/20 shadow-neumorphic">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-success">Vahvuudet</h4>
                  <Badge className="bg-success/20 text-success hover:bg-success/20">S</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.strengths.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-success/20 text-success rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-success">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {swotData.weaknesses && (
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 shadow-neumorphic">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-destructive">Heikkoudet</h4>
                  <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/20">W</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.weaknesses.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-destructive/20 text-destructive rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-destructive">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {swotData.opportunities && (
              <div className="p-4 bg-info/10 rounded-lg border border-info/20 shadow-neumorphic">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-info">Mahdollisuudet</h4>
                  <Badge className="bg-info/20 text-info hover:bg-info/20">O</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.opportunities.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-info/20 text-info rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-info">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {swotData.threats && (
              <div className="p-4 bg-warning/10 rounded-lg border border-warning/20 shadow-neumorphic">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-warning">Uhat</h4>
                  <Badge className="bg-warning/20 text-warning hover:bg-warning/20">T</Badge>
                </div>
                <div className="space-y-2">
                  {swotData.threats.split(';').filter(Boolean).map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <span className="bg-warning/20 text-warning rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 text-xs font-medium">{index + 1}</span>
                      <p className="text-warning">{cleanMarkdownText(item.trim())}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-muted rounded-lg border border-border shadow-neumorphic">
            <p className="text-muted-foreground">SWOT-analyysia ei ole saatavilla tälle yritykselle.</p>
          </div>
        )}
      </div>

      {/* Riskiarviointi */}
      {valuationReport?.analysis?.risk_assessment?.content && (
        <div className="border border-warning/20 rounded-xl p-6 bg-warning/10 shadow-neumorphic">
          <h3 className="text-lg font-semibold flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
            {valuationReport.analysis.risk_assessment.title || "Riskiarviointi"}
          </h3>
          <div className="bg-card p-4 rounded-lg border border-warning/20 shadow-neumorphic">
            <p className="whitespace-pre-line">{cleanMarkdownText(valuationReport.analysis.risk_assessment.content)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwotAndRiskTab;