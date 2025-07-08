
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Share2, Check, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { generateMasterPDF } from "@/components/assessment/utils";
import { AnalysisResults } from "@/components/assessment/types";
import { ShareReportDialog } from "@/components/reports/ShareReportDialog";

interface MasterReportGeneratorProps {
  companyName?: string;
  analysisResults?: AnalysisResults | null;
  companyData?: any;
}

const MasterReportGenerator: React.FC<MasterReportGeneratorProps> = ({ 
  companyName = "Yrityksesi", 
  analysisResults,
  companyData 
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState<boolean>(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      toast({
        title: "Luodaan raporttia...",
        description: "Tämä voi kestää hetken.",
      });
      
      const pdfBlob = await generateMasterPDF(analysisResults, companyData, companyName);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Myyntikuntoisuus_Master_${companyName}_${new Date().toLocaleDateString('fi-FI').replace(/\./g, '_')}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast({
        title: "Raportti valmis!",
        description: "Master-raportti on ladattu onnistuneesti.",
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      
      toast({
        title: "Raportin luonti epäonnistui",
        description: "Yritä uudelleen myöhemmin.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full bg-white/90 shadow-lg rounded-3xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <FileText className="text-purple-500" />
          Master-raportin luonti
        </CardTitle>
        <CardDescription>
          Luo kattava PDF-raportti, jossa on kaikki myyntikuntoisuuteen liittyvät tiedot
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <p className="text-sm text-gray-600">
              Premium-ominaisuus: Master-raportti sisältää yksityiskohtaiset tiedot yrityksestäsi, 
              myyntikuntoisuuden arviot, kehitysehdotukset ja automaattisen analyysin.
            </p>
          </div>
          
          <ul className="space-y-2">
            {[
              "Kattava yritysanalyysi",
              "Myyntikuntoisuuden arviointi osa-alueittain",
              "Graafiset esitykset ja visualisoinnit",
              "Automaattiset kehitysehdotukset",
              "Ostajaprofiilin analyysi"
            ].map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-4 flex-wrap">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setIsShareDialogOpen(true)}
        >
          <Share2 className="h-4 w-4" />
          Jaa raportti
        </Button>
        
        <Button 
          onClick={handleGenerateReport}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
          disabled={isGenerating || !analysisResults}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Luodaan...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Luo master-raportti
            </>
          )}
        </Button>
      </CardFooter>

      <ShareReportDialog 
        open={isShareDialogOpen} 
        onOpenChange={setIsShareDialogOpen} 
        companyName={companyName}
      />
    </Card>
  );
};

export default MasterReportGenerator;
