import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyPreviewSearch } from "./CompanyPreviewSearch";
import { ProgressiveValuationCard } from "./ProgressiveValuationCard";
import { ValuationProgress } from "./ValuationProgress";
import BusinessValueCalculator from "@/components/calculator/BusinessValueCalculator";

interface EnhancedHeroProps {
  handleNavigation: () => void;
  scrollToSection: (id: string) => void;
}

export default function EnhancedHero({ handleNavigation, scrollToSection }: EnhancedHeroProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorInitialData, setCalculatorInitialData] = useState<any>(null);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);

  const handlePreviewFound = (data: any) => {
    setPreviewData(data);
    setIsLoadingFullData(true);
    // Start fetching full data immediately
    fetchFullCalculation(data);
  };

  const fetchFullCalculation = async (previewData: any) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-calculator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            businessId: previewData.businessId,
            companyName: previewData.name
          }),
        }
      );

      if (response.ok) {
        const fullData = await response.json();
        // Update preview with full data
        setPreviewData((prev: any) => ({
          ...prev,
          ...fullData,
          isFullDataLoaded: true
        }));
      }
    } catch (error) {
      console.error("Failed to fetch full calculation:", error);
    } finally {
      setIsLoadingFullData(false);
    }
  };

  const handleCalculateClick = () => {
    setCalculatorInitialData({
      businessId: previewData.businessId,
      companyName: previewData.name
    });
    setShowCalculator(true);
    
    // Smooth scroll to calculator
    setTimeout(() => {
      const element = document.getElementById("calculator-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <>
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
              Selvitä yrityksesi <span className="text-primary">todellinen arvo</span> sekunneissa
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Näet heti alustavan arvion perustuen toimialasi todellisiin kertoimiin ja yrityksesi lukuihin
            </p>

            {/* Company search */}
            <div className="max-w-2xl mx-auto">
              <CompanyPreviewSearch onPreviewFound={handlePreviewFound} />
            </div>
          </motion.div>

          {/* Loading progress */}
          {isLoadingFullData && !previewData?.isFullDataLoaded && (
            <ValuationProgress 
              isLoading={isLoadingFullData}
              onComplete={() => console.log("Loading complete")}
            />
          )}

          {/* Preview results */}
          {previewData && !isLoadingFullData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <ProgressiveValuationCard
                data={previewData}
                onCalculateClick={handleCalculateClick}
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Calculator section - only visible when user clicks */}
      {showCalculator && (
        <section id="calculator-section" className="py-16 bg-muted/30">
          <div className="container max-w-4xl mx-auto px-4">
            <BusinessValueCalculator
              prefilledCompany={calculatorInitialData.companyName}
              prefilledBusinessId={calculatorInitialData.businessId}
            />
          </div>
        </section>
      )}
    </>
  );
}