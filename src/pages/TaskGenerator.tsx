import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/hooks/use-company";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyTasks } from "@/hooks/use-company-tasks";
import { Loader2, Sparkles, ClipboardList, RefreshCw } from "lucide-react";

const TaskGenerator = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { companies } = useCompany();
  const { fetchTasks } = useCompanyTasks();
  
  const [selectedCompany, setSelectedCompany] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [valuations, setValuations] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedValuation, setSelectedValuation] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [existingTasks, setExistingTasks] = useState(0);
  
  useEffect(() => {
    if (!selectedCompany) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Fetching data for company:", selectedCompany);
        
        const { data: assessmentData, error: assessmentError } = await supabase
          .from("assessments")
          .select("*")
          .eq("company_id", selectedCompany)
          .order("created_at", { ascending: false });
          
        if (assessmentError) {
          console.error("Error fetching assessments:", assessmentError);
          throw assessmentError;
        }
        
        console.log("Fetched assessments:", assessmentData);
        setAssessments(assessmentData || []);
        
        const { data: valuationData, error: valuationError } = await supabase
          .from("valuations")
          .select("*")
          .eq("company_id", selectedCompany)
          .order("created_at", { ascending: false });
          
        if (valuationError) {
          console.error("Error fetching valuations:", valuationError);
          throw valuationError;
        }
        
        console.log("Fetched valuations:", valuationData);
        setValuations(valuationData || []);
        
        const tasks = await fetchTasks(selectedCompany);
        console.log("Fetched tasks:", tasks);
        setExistingTasks(tasks.length);
        
        if (assessmentData && assessmentData.length > 0) {
          setSelectedAssessment(assessmentData[0].id);
        }
        
        if (valuationData && valuationData.length > 0) {
          setSelectedValuation(valuationData[0].id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Virhe",
          description: "Tietojen hakeminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedCompany, fetchTasks, toast]);
  
  const handleGenerateTasks = async () => {
    if (!selectedCompany || !selectedAssessment || !selectedValuation) {
      toast({
        title: "Puuttuvia tietoja",
        description: "Valitse yritys, arviointi ja arvonmääritys",
        variant: "destructive",
      });
      return;
    }
    
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-tasks", {
        body: {
          companyId: selectedCompany,
          assessmentId: selectedAssessment,
          valuationId: selectedValuation
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Tehtävät generoitu",
        description: `${data.taskCount} tehtävää luotu onnistuneesti.`,
      });
      
      navigate(`/tasks/${selectedCompany}`);
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast({
        title: "Virhe",
        description: "Tehtävien generointi epäonnistui",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout 
      pageTitle="Tehtävägeneraattori" 
      pageDescription="Luo tehtäviä yrityksesi myyntikunnon parantamiseksi."
      showBackButton={true}
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Tehtävägeneraattori
            </CardTitle>
            <CardDescription>
              Generoi räätälöityjä tehtäviä yrityksesi myyntikunnon ja arvon parantamiseksi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Valitse yritys</label>
                <Select
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Valitse yritys" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Valitse myyntikunto-arviointi</label>
                    <Select
                      value={selectedAssessment}
                      onValueChange={setSelectedAssessment}
                      disabled={assessments.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={assessments.length === 0 ? "Ei arviointeja saatavilla" : "Valitse arviointi"} />
                      </SelectTrigger>
                      <SelectContent>
                        {assessments.map((assessment) => (
                          <SelectItem key={assessment.id} value={assessment.id}>
                            {new Date(assessment.created_at).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assessments.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">
                        Yritykselle ei ole vielä tehty myyntikunto-arviointia. Tämä vaaditaan tehtävien luomiseen.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Valitse arvonmääritys</label>
                    <Select
                      value={selectedValuation}
                      onValueChange={setSelectedValuation}
                      disabled={valuations.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={valuations.length === 0 ? "Ei arvonmäärityksiä saatavilla" : "Valitse arvonmääritys"} />
                      </SelectTrigger>
                      <SelectContent>
                        {valuations.map((valuation) => (
                          <SelectItem key={valuation.id} value={valuation.id}>
                            {new Date(valuation.created_at).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {valuations.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">
                        Yritykselle ei ole vielä tehty arvonmääritystä. Tämä vaaditaan tehtävien luomiseen.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {existingTasks > 0 && (
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="flex items-center">
                  <ClipboardList className="h-5 w-5 text-blue-500 mr-2" />
                  <p className="text-sm text-blue-700">
                    Yrityksellä on jo {existingTasks} tehtävää. Uusien tehtävien luominen ei poista olemassa olevia tehtäviä.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/tasks')}
              >
                Peruuta
              </Button>
              
              <Button
                onClick={handleGenerateTasks}
                disabled={!selectedCompany || !selectedAssessment || !selectedValuation || generating}
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generoidaan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generoi tehtävät
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TaskGenerator;
