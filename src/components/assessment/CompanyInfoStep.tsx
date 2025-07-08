
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; 
import { useCompany } from "@/hooks/use-company";
import { useToast } from "@/hooks/use-toast";
import BusinessIdSearch from "@/components/company/BusinessIdSearch";
import { YTJCompanyData } from "@/utils/ytj-service";
import { Search, Building } from "lucide-react";

interface CompanyInfoStepProps {
  companyName: string;
  setCompanyName: (name: string) => void;
  handleNext: () => void;
  isLoading: boolean;
  error: string;
}

type SearchMode = "name" | "businessId";

const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({
  companyName,
  setCompanyName,
  handleNext,
  isLoading,
  error
}) => {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [searchMode, setSearchMode] = useState<SearchMode>("name");
  const [businessId, setBusinessId] = useState<string>("");

  // If activeCompany exists, use its name as the default
  useEffect(() => {
    if (activeCompany && !companyName) {
      console.log("Setting company name from activeCompany:", activeCompany.name);
      setCompanyName(activeCompany.name);
    }
  }, [activeCompany, companyName, setCompanyName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName || companyName.trim() === "") {
      console.log("Form submission failed: Empty company name");
      toast({
        title: "Virhe",
        description: "Syötä yrityksen nimi ennen jatkamista.",
        variant: "destructive"
      });
      return;
    }

    const trimmedName = companyName.trim();
    console.log("Form submitted with trimmed company name:", trimmedName);
    
    // Make sure we set the trimmed name first
    setCompanyName(trimmedName);
    
    // Debug logging for request to edge function
    console.log("Proceeding to next step with validated company name:", JSON.stringify({companyName: trimmedName}));
    
    handleNext();
  };

  const handleCompanyFound = (company: YTJCompanyData) => {
    console.log("Company found from YTJ:", company);
    setCompanyName(company.name);
    setBusinessId(company.business_id);
    
    // Proceed to next step automatically when company is found
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  return (
    <Card className="card-3d mb-8">
      <CardHeader className="pb-4">
        <CardTitle>Yrityksen tiedot</CardTitle>
        <CardDescription>
          Aloitetaan syöttämällä yrityksen tiedot. Voit hakea tiedot Y-tunnuksella tai syöttää yrityksen nimen manuaalisesti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="businessId" value={searchMode} onValueChange={(value) => setSearchMode(value as SearchMode)} className="mb-6">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="businessId" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Hae Y-tunnuksella</span>
            </TabsTrigger>
            <TabsTrigger value="name" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span>Syötä manuaalisesti</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="businessId" className="space-y-4">
            <BusinessIdSearch 
              onCompanyFound={handleCompanyFound}
              showCard={false}
              buttonText="Hae tiedot"
            />
          </TabsContent>
          
          <TabsContent value="name" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                  Yrityksen nimi
                </label>
                <Input
                  id="company-name"
                  type="text"
                  placeholder="Esim. Yritys Oy"
                  value={companyName || ""}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("Input value changed to:", newValue);
                    setCompanyName(newValue);
                  }}
                  required
                  className="w-full"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !companyName || companyName.trim() === ""}
              >
                {isLoading ? "Haetaan tietoja..." : "Jatka"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CompanyInfoStep;
