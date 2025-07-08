import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OverviewCard from "@/components/dashboard/OverviewCard";
import RecentUserActivities from "@/components/dashboard/RecentUserActivities";
import QuickActions from "@/components/dashboard/QuickActions";
import ProfileCard from "@/components/dashboard/ProfileCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/hooks/use-company";
import { FileBarChart, CheckSquare, Building, ArrowRight, PlusCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ValuationsList from "@/components/valuation/ValuationsList";

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

interface ActivityItem {
  id: string;
  type: "assessment" | "valuation" | "task" | "document";
  title: string;
  date: string;
  description?: string;
  link: string;
}

const Index = () => {
  const { user } = useAuth();
  const { hasCompany, loading: companyLoading } = useCompany();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: "1",
      type: "assessment",
      title: "Myyntikuntoisuuden arviointi suoritettu",
      date: new Date().toISOString(),
      link: "/assessment",
    },
    {
      id: "2",
      type: "task",
      title: "Toimenpidelistan luonti",
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      link: "/tasks",
    },
    {
      id: "3",
      type: "document",
      title: "Arvonmääritys valmistunut",
      date: "2023-05-20T10:00:00Z",
      link: "/valuation",
    },
  ]);

  const [valuations, setValuations] = useState([]);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [companyValue, setCompanyValue] = useState<ValuationValue>({
    value: 0,
    formattedValue: "0€"
  });

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
    if (user) {
      fetchRecentValuations();
    }
  }, [user]);

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
                
                let previousValue = null;
                
                if (data.length > 1 && 
                    data[1].results && 
                    typeof data[1].results === 'object' && 
                    !Array.isArray(data[1].results)) {
                  
                  const prevValueReportObj = data[1].results as ValuationReportType;
                  
                  if (prevValueReportObj.valuationReport && 
                      typeof prevValueReportObj.valuationReport === 'object' &&
                      prevValueReportObj.valuationReport.valuation_numbers &&
                      prevValueReportObj.valuationReport.valuation_numbers.most_likely_value !== undefined) {
                    
                    previousValue = parseFloat(
                      prevValueReportObj.valuationReport.valuation_numbers.most_likely_value.toString()
                    );
                  }
                }
                
                const newCompanyValue: ValuationValue = {
                  value: currentValue,
                  formattedValue: formatCompanyValue(currentValue)
                };
                
                if (previousValue !== null) {
                  const difference = currentValue - previousValue;
                  newCompanyValue.previous = previousValue;
                  newCompanyValue.formattedDifference = formatCompanyValue(Math.abs(difference));
                  newCompanyValue.trend = difference > 0 ? "up" : difference < 0 ? "down" : "neutral";
                }
                
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
      <DashboardLayout 
        pageTitle="Etusivu" 
        pageDescription="Ladataan..."
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasCompany) {
    return (
      <DashboardLayout 
        pageTitle="Etusivu" 
        pageDescription="Tervetuloa Myyntikuntoon-työkaluun!"
      >
        <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/50">
          <CardHeader className="text-center py-4 sm:py-6">
            <CardTitle className="text-xl sm:text-2xl text-indigo-700">Aloita lisäämällä yritys</CardTitle>
            <CardDescription className="text-sm sm:text-base text-indigo-600">
              Ennen kuin voit käyttää työkaluja, sinun täytyy lisätä vähintään yksi yritys
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-4 sm:pb-6">
            <div className="mb-4 sm:mb-6 mt-1 sm:mt-2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <Building className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-600" />
            </div>
            <div className="text-center max-w-md mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-slate-600">
                Lisäämällä yrityksesi tiedot voit suorittaa myyntikuntoisuuden arvioinnin, 
                käyttää työkaluja jotka auttavat yrityksesi myyntiprosessissa.
              </p>
            </div>
            <Button 
              onClick={() => navigate("/profile")} 
              className="gap-2"
              size={isMobile ? "default" : "lg"}
            >
              Lisää yritys <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      pageTitle="Etusivu" 
      pageDescription="Tervetuloa Myyntikuntoon-työkaluun!"
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
          <OverviewCard
            title="Yrityksen arvo"
            value={companyValue.formattedValue}
            description="Arvioitu myyntihinta"
            icon={<FileBarChart className="h-5 w-5 text-white" />}
            iconColor="bg-green-500"
            trend={companyValue.trend}
            trendValue={companyValue.trend ? `${companyValue.trend === "up" ? "+" : ""}${companyValue.formattedDifference} edellisestä` : undefined}
          />
          
          <OverviewCard
            title="Tehtävät"
            value="4/12"
            description="Suoritettu"
            icon={<CheckSquare className="h-5 w-5 text-white" />}
            iconColor="bg-pink-500"
          />
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-6">
          <div className="md:col-span-4 space-y-4 sm:space-y-6">
            <QuickActions />
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base sm:text-lg font-medium">
                  Viimeisimmät arvonmääritykset
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/valuation")}
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                >
                  <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Uusi arvonmääritys
                </Button>
              </CardHeader>
              <CardContent>
                <ValuationsList 
                  valuations={valuations} 
                  isLoading={loadingValuations}
                  showViewButton={true}
                  onSelect={(valuation) => navigate(`/valuation?id=${valuation.id}`)}
                  onRefresh={fetchRecentValuations}
                />
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <ProfileCard />
            <RecentUserActivities limit={5} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
