import React from 'react';
import { DCFStructuredData } from '@/types/dcf-analysis';
import { DCFFullAnalysisResults } from './variants/DCFFullAnalysisResults';
import { DCFSimplifiedAnalysisResults } from './variants/DCFSimplifiedAnalysisResults';
import { DCFForwardLookingAnalysisResults } from './variants/DCFForwardLookingAnalysisResults';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface DCFAnalysisResultsProps {
  analysisData: DCFStructuredData;
}

export const DCFAnalysisResults: React.FC<DCFAnalysisResultsProps> = ({ analysisData }) => {
  // Check for required data
  if (!analysisData.valuation_summary || !analysisData.valuation_summary.probability_weighted_valuation) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          DCF-analyysi on puutteellinen. Tarvittavia tietoja puuttuu.
        </AlertDescription>
      </Alert>
    );
  }

  // Route to appropriate variant component based on dcf_variant
  switch (analysisData.dcf_variant) {
    case 'full_dcf':
      return <DCFFullAnalysisResults analysisData={analysisData} />;
    
    case 'simplified_dcf':
      return <DCFSimplifiedAnalysisResults analysisData={analysisData} />;
    
    case 'forward_looking_dcf':
      return <DCFForwardLookingAnalysisResults analysisData={analysisData} />;
    
    default:
      // Fallback: use confidence score to determine variant
      if (analysisData.confidence_assessment?.overall_confidence_score) {
        const confidence = analysisData.confidence_assessment.overall_confidence_score;
        
        if (confidence >= 8) {
          return <DCFFullAnalysisResults analysisData={analysisData} />;
        } else if (confidence >= 5) {
          return <DCFSimplifiedAnalysisResults analysisData={analysisData} />;
        } else {
          return <DCFForwardLookingAnalysisResults analysisData={analysisData} />;
        }
      }
      
      // Last resort: default to simplified
      return <DCFSimplifiedAnalysisResults analysisData={analysisData} />;
  }
};