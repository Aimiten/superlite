import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OverviewCard from "@/components/dashboard/OverviewCard";
import QuickActions from "@/components/dashboard/QuickActions";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { FileBarChart, Building, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ValuationValue {
  value: number;
  previous?: number;
  formattedValue: string;
  formattedDifference?: string;
  trend?: "up" | "down" | "neutral";
}

interface ValuationNumbersType {
  range: {
    low: number;
    high: number;
  };
  most_likely_value: number;
  valuation_rationale: string;
}

interface ValuationReportType {
  valuationReport: {
    valuation_numbers: ValuationNumbersType;
    [key: string]: any;
  };
  [key: string]: any;
}

const Index = () => {
  const { user } = useAuth();
  const { hasCompany, loading: companyLoading, activeCompany } = useCompany();
  const isMobile = useIsMobile();
  const navigate = useNavigate();


  const [valuations, setValuations] = useState([]);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [companyValue, setCompanyValue] = useState<ValuationValue>({
    value: 0,
    formattedValue: "0€"
  });
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);

  const formatCompanyValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    } else if (value >= 1000) {
      return `${Math.round(value / 1000)}k€`;
    } else {
      return `${value}€`;
    }
  };

  useEffect(() => {
    if (user && activeCompany) {
      fetchRecentValuations();
      fetchImpactAnalysis();
    }
  }, [user, activeCompany]);

  const fetchImpactAnalysis = async () => {
    if (!user || !activeCompany) return;

    try {
      const { data, error } = await supabase
        .from('valuation_impact_analysis')
        .select('*')
        .eq('company_id', activeCompany.id)
        .eq('status', 'completed')
        .order('calculation_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error fetching impact analysis:", error);
        return;
      }

      if (data) {
        console.log("Found impact analysis for dashboard");
        setImpactAnalysis(data);
      }
    } catch (err) {
      console.error("Error in fetchImpactAnalysis:", err);
    }
  };

  const fetchRecentValuations = async () => {
    if (!user) return;

    try {
      setLoadingValuations(true);
      console.log("Fetching valuations for dashboard");

      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching valuations:", error);
        return;
      }

      if (data) {
        console.log(`Found ${data.length} valuations for dashboard`);
        setValuations(data);

        if (data.length > 0) {
          const latestValuation = data[0];

          if (latestValuation.results && 
              typeof latestValuation.results === 'object' && 
              !Array.isArray(latestValuation.results)) {

            const valueReportObj = latestValuation.results as ValuationReportType;

            if (valueReportObj.valuationReport && 
                typeof valueReportObj.valuationReport === 'object' &&
                valueReportObj.valuationReport.valuation_numbers) {

              const valNumbers = valueReportObj.valuationReport.valuation_numbers;

              if (valNumbers.most_likely_value !== undefined) {
                const currentValue = parseFloat(valNumbers.most_likely_value.toString());

                const newCompanyValue: ValuationValue = {
                  value: currentValue,
                  formattedValue: formatCompanyValue(currentValue)
                };

                setCompanyValue(newCompanyValue);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Error in fetchRecentValuations:", err);
    } finally {
      setLoadingValuations(false);
    }
  };

  if (companyLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasCompany) {
    return (
      <DashboardLayout>
        <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
          <CardHeader className="text-center py-4 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl text-primary">Aloita lisäämällä yritys</CardTitle>
            <CardDescription className="text-sm sm:text-base text-primary/80">
              Aloita lisäämällä yrityksesi tiedot.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-4 sm:pb-6">
            <div className="mb-4 sm:mb-6 mt-1 sm:mt-2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Building className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div className="text-center max-w-md mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-muted-foreground">
                Lisäämällä yrityksesi tiedot voit suorittaa alustavan arvonmäärityksen, myyntikuntoisuuden arvioinnin, ja lähteä kehittämään yrityksesi myyntikuntoa sekä arvoa systemaattisesti.
              </p>
            </div>
            <Button 
              onClick={() => navigate("/profile")} 
              className="gap-2 text-white"
              size={isMobile ? "default" : "lg"}
            >
              <span className="text-white">Lisää yritys</span> <ArrowRight className="h-4 w-4 text-white" />
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Yläosan Overview-kortit (säilyvät ennallaan) */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1">
          <OverviewCard
            title={
              <div className="flex items-center gap-2">
                Yrityksen arvo
                {activeCompany?.name && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {activeCompany.name}
                  </span>
                )}
              </div>
            }
            value={(() => {
              // Jos on impact analysis, näytä korjattu arvo
              if (impactAnalysis?.adjusted_valuation_result?.averageValuation) {
                return formatCompanyValue(impactAnalysis.adjusted_valuation_result.averageValuation);
              }
              // Muuten näytä alkuperäinen arvo
              return companyValue.value > 0 ? companyValue.formattedValue : "Ei arvioitu vielä";
            })()}
            description={impactAnalysis ? "Myyntikuntoisuuden jälkeen" : "Arvioitu myyntihinta"}
            icon={<FileBarChart className="h-5 w-5 text-white" />}
            iconColor="bg-success"
            trend={(() => {
              // Jos on impact analysis, vertaa alkuperäiseen
              if (impactAnalysis?.original_valuation_snapshot?.averageValuation && 
                  impactAnalysis?.adjusted_valuation_result?.averageValuation) {
                const diff = impactAnalysis.adjusted_valuation_result.averageValuation - 
                            impactAnalysis.original_valuation_snapshot.averageValuation;
                return diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
              }
              return undefined;
            })()}
            trendValue={(() => {
              // Jos on impact analysis, näytä vaikutus
              if (impactAnalysis?.original_valuation_snapshot?.averageValuation && 
                  impactAnalysis?.adjusted_valuation_result?.averageValuation) {
                const diff = impactAnalysis.adjusted_valuation_result.averageValuation - 
                            impactAnalysis.original_valuation_snapshot.averageValuation;
                const formattedDiff = formatCompanyValue(Math.abs(diff));
                return `${diff >= 0 ? "+" : "-"}${formattedDiff} myyntikuntoisuuden vaikutus`;
              }
              return undefined;
            })()}
          />

        </div>

        {/* QuickActions nyt täysleveänä */}
        <QuickActions />

      </div>
    </DashboardLayout>
  );
};

export default Index;