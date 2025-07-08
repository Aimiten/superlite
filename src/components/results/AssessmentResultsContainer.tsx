
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, ArrowLeft } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { generateAssessmentPDF } from "@/components/assessment/utils";
import { AnalysisResults } from "@/components/assessment/types";
import AnalysisResultsCard from "./AnalysisResultsCard";
import RecommendationsCard from "./RecommendationsCard";

interface AssessmentResultsContainerProps {
  analysisResults?: AnalysisResults | null;
  answers?: Record<string, any>;
  onBack?: () => void;
}

const AssessmentResultsContainer: React.FC<AssessmentResultsContainerProps> = ({ 
  analysisResults, 
  answers = {},
  onBack
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log("AssessmentResultsContainer rendering - checking if button is interactive");
  console.log("Current location:", location.pathname, location.search);

  const handleBackToList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Back button clicked - handleBackToList function triggered");
    
    if (onBack) {
      // Jos onBack on annettu, käytetään sitä (tabbed mode)
      onBack();
    } else {
      // Muuten käytetään URL-navigointia (legacy mode)
      navigate('/assessment', { replace: true });
      
      // Add a small delay to ensure the navigation completes before we try to modify the DOM
      setTimeout(() => {
        // Force URL to be clean without any parameters
        if (window.history && location.search) {
          window.history.replaceState({}, '', '/assessment');
        }
        
        console.log("Navigation to assessment list should be complete now");
      }, 50);
    }
  };

  // Ensure recommendations is an array
  const recommendations = Array.isArray(analysisResults?.recommendations) 
    ? analysisResults.recommendations 
    : [];

  const handleDownloadReport = async () => {
    try {
      // Show loading toast
      toast({
        title: "Luodaan raporttia...",
        description: "Odota hetki, raporttia luodaan."
      });
      
      // Generate the PDF
      const pdfBlob = await generateAssessmentPDF(analysisResults);
      
      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Myyntikuntoisuusraportti_${new Date().toLocaleDateString('fi-FI').replace(/\./g, '_')}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      // Show success toast
      toast({
        title: "Raportti ladattu",
        description: "Myyntikuntoisuuden raportti on ladattu PDF-muodossa."
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      
      // Show error toast
      toast({
        title: "Virhe raportin luonnissa",
        description: "Raportin luonti epäonnistui. Ole hyvä ja yritä uudelleen.",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Myyntikuntoisuuden arviointi</h1>
          <p className="mt-2 text-gray-600">
            Analyysi yrityksesi myyntikuntoisuudesta ja kehitysehdotukset
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleDownloadReport} 
          className="flex items-center rounded-full"
          disabled={!analysisResults}
        >
          <Download className="mr-2 h-4 w-4" />
          Lataa raportti
        </Button>
      </div>

      <AnalysisResultsCard analysisResults={analysisResults} />

      {recommendations.length > 0 && (
        <RecommendationsCard recommendations={recommendations} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button 
          variant="outline"
          onClick={(e) => {
            console.log("Button clicked - event:", e.type);
            handleBackToList(e);
          }}
          className="flex items-center gap-2 rounded-full"
          style={{ cursor: 'pointer', zIndex: 10 }}
        >
          <ArrowLeft className="h-4 w-4" />
          Takaisin arviointeihin
        </Button>
        
        <Link to="/simulator">
          <Button className="flex items-center rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 cursor-pointer">
            Siirry simulaattoriin
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default AssessmentResultsContainer;
