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
      <div className="border border-primary/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold flex items-center mb-4">
          <Building className="h-5 w-5 mr-2 text-primary" />
          Yritysanalyysi
          <Badge variant="outline" className="ml-2 text-xs">Tekoälyn analyysi</Badge>
        </h3>

        <div className="grid gap-6">
          {/* Liiketoiminnan kuvaus */}
          {(companyInfoAnalysis?.liiketoiminnanKuvaus || companyInfo?.structuredData?.description) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Target className="h-4 w-4 text-info" />
                </div>
                <h4 className="text-md font-medium">Liiketoiminnan kuvaus</h4>
                <Badge variant="secondary" className="text-xs">Ydintoiminta</Badge>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="whitespace-pre-line text-muted-foreground">
                  {cleanMarkdownText(companyInfoAnalysis?.liiketoiminnanKuvaus || companyInfo?.structuredData?.description)}
                </p>
              </div>
            </div>
          )}

          {/* Markkina-asema */}
          {(companyInfoAnalysis?.asiakasJaMarkkina || companyInfo?.structuredData?.market_position) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-success/10 rounded-lg">
                  <MapPin className="h-4 w-4 text-success" />
                </div>
                <h4 className="text-md font-medium">Markkina-asema</h4>
                <Badge variant="secondary" className="text-xs bg-success/10 text-success">Markkinointi</Badge>
              </div>
              <div className="bg-success/5 p-4 rounded-lg border border-success/20">
                <p className="whitespace-pre-line text-muted-foreground">
                  {cleanMarkdownText(companyInfoAnalysis?.asiakasJaMarkkina || companyInfo?.structuredData?.market_position)}
                </p>
              </div>
            </div>
          )}

          {/* Kilpailuedut */}
          {companyInfoAnalysis?.kilpailuJaErot && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <h4 className="text-md font-medium">Kilpailuedut ja erottautumistekijät</h4>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Erottautumistekijät</Badge>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="whitespace-pre-line text-muted-foreground">
                  {cleanMarkdownText(companyInfoAnalysis.kilpailuJaErot)}
                </p>
              </div>
            </div>
          )}

          {/* Strategia ja tulevaisuus */}
          {companyInfoAnalysis?.strategiaJaTulevaisuus && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-warning" />
                </div>
                <h4 className="text-md font-medium">Strategia ja tulevaisuus</h4>
                <Badge variant="secondary" className="text-xs bg-warning/10 text-warning">Visio</Badge>
              </div>
              <div className="bg-warning/5 p-4 rounded-lg border border-warning/20">
                <p className="whitespace-pre-line text-muted-foreground">
                  {cleanMarkdownText(companyInfoAnalysis.strategiaJaTulevaisuus)}
                </p>
              </div>
            </div>
          )}

          {/* Lähdetiedot */}
          {companyInfoAnalysis?.lahteet && (
            <div className="mt-6 p-3 bg-muted rounded-lg border border-muted">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Tietolähteet</span>
              </div>
              <p className="text-xs text-muted-foreground italic">{cleanMarkdownText(companyInfoAnalysis.lahteet)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Liiketoimintamalli-analyysi arvonmäärityksestä */}
      {valuationReport?.analysis?.business_model?.content && (
        <div className="border border-info/10 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-info to-primary p-4">
            <h3 className="text-lg font-semibold flex items-center text-white">
              <Building className="h-5 w-5 mr-2" />
              {valuationReport.analysis.business_model.title || "Liiketoimintamalli ja kilpailuedut"}
              <Badge variant="outline" className="ml-2 text-xs border-white text-white bg-white/10">
                Arvonmääritysanalyysi
              </Badge>
            </h3>
          </div>
          <div className="p-6 bg-info/5">
            <div className="bg-white p-4 rounded-lg border border-muted">
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">
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
        <div className="border border-muted rounded-xl p-8 text-center">
          <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Building className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground mb-2">Yritysanalyysi ei saatavilla</h3>
          <p className="text-muted-foreground text-sm">
            Yrityksen tarkempaa analyysiä ei voitu tuottaa saatavilla olevien tietojen perusteella.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyAnalysisTab;