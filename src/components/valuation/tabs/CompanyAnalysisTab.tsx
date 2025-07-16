import React from "react";
import { Building, MapPin, Users, Target, Lightbulb, TrendingUp, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cleanMarkdownText } from "@/utils/markdownUtils";

interface CompanyAnalysisTabProps {
  companyInfo: any;
  companyInfoAnalysis: any;
  valuationReport: any;
}

const CompanyAnalysisTab: React.FC<CompanyAnalysisTabProps> = ({
  companyInfo,
  companyInfoAnalysis,
  valuationReport
}) => {
  return (
    <div className="space-y-6">
      {/* Yrityksen perustiedot */}
      <div className="border border-indigo-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <Building className="h-5 w-5 mr-2 text-indigo-600" />
          Yritysanalyysi
          <Badge variant="outline" className="ml-2 text-xs">Tekoälyn analyysi</Badge>
        </h3>

        <div className="grid gap-6">
          {/* Liiketoiminnan kuvaus */}
          {(companyInfoAnalysis?.liiketoiminnanKuvaus || companyInfo?.structuredData?.description) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="text-md font-medium">Liiketoiminnan kuvaus</h4>
                <Badge variant="secondary" className="text-xs">Ydintoiminta</Badge>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="whitespace-pre-line text-slate-700">
                  {cleanMarkdownText(companyInfoAnalysis?.liiketoiminnanKuvaus || companyInfo?.structuredData?.description)}
                </p>
              </div>
            </div>
          )}

          {/* Markkina-asema */}
          {(companyInfoAnalysis?.asiakasJaMarkkina || companyInfo?.structuredData?.market_position) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <h4 className="text-md font-medium">Markkina-asema</h4>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Markkinointi</Badge>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="whitespace-pre-line text-slate-700">
                  {cleanMarkdownText(companyInfoAnalysis?.asiakasJaMarkkina || companyInfo?.structuredData?.market_position)}
                </p>
              </div>
            </div>
          )}

          {/* Kilpailuedut */}
          {companyInfoAnalysis?.kilpailuJaErot && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                </div>
                <h4 className="text-md font-medium">Kilpailuedut ja erottautumistekijät</h4>
                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Erottautumistekijät</Badge>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="whitespace-pre-line text-slate-700">
                  {cleanMarkdownText(companyInfoAnalysis.kilpailuJaErot)}
                </p>
              </div>
            </div>
          )}

          {/* Strategia ja tulevaisuus */}
          {companyInfoAnalysis?.strategiaJaTulevaisuus && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <h4 className="text-md font-medium">Strategia ja tulevaisuus</h4>
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Visio</Badge>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <p className="whitespace-pre-line text-slate-700">
                  {cleanMarkdownText(companyInfoAnalysis.strategiaJaTulevaisuus)}
                </p>
              </div>
            </div>
          )}

          {/* Lähdetiedot */}
          {companyInfoAnalysis?.lahteet && (
            <div className="mt-6 p-3 bg-slate-100 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-slate-700">Tietolähteet</span>
              </div>
              <p className="text-xs text-slate-500 italic">{cleanMarkdownText(companyInfoAnalysis.lahteet)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Liiketoimintamalli-analyysi arvonmäärityksestä */}
      {valuationReport?.analysis?.business_model?.content && (
        <div className="border border-blue-100 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
            <h3 className="text-lg font-semibold flex items-center text-white">
              <Building className="h-5 w-5 mr-2" />
              {valuationReport.analysis.business_model.title || "Liiketoimintamalli ja kilpailuedut"}
              <Badge variant="outline" className="ml-2 text-xs border-white text-white bg-white/10">
                Arvonmääritysanalyysi
              </Badge>
            </h3>
          </div>
          <div className="p-6 bg-blue-50">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <p className="whitespace-pre-line text-slate-700 leading-relaxed">
                {cleanMarkdownText(valuationReport.analysis.business_model.content)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Jos ei ole lainkaan yritysanalyysiä */}
      {!companyInfoAnalysis?.liiketoiminnanKuvaus && 
       !companyInfo?.structuredData?.description && 
       !valuationReport?.analysis?.business_model?.content && (
        <div className="border border-slate-200 rounded-xl p-8 text-center">
          <div className="p-4 bg-slate-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Building className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">Yritysanalyysi ei saatavilla</h3>
          <p className="text-slate-500 text-sm">
            Yrityksen tarkempaa analyysiä ei voitu tuottaa saatavilla olevien tietojen perusteella.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyAnalysisTab;