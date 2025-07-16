import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchYTJData, isValidBusinessId, YTJCompanyData } from "@/utils/ytj-service";

interface BusinessIdSearchProps {
  onCompanyFound?: (company: YTJCompanyData) => void;
  showCard?: boolean;
  initialValue?: string;
  buttonText?: string;
  placeholder?: string;
  label?: string;
}

// Some known valid test business IDs for YTJ API
const EXAMPLE_BUSINESS_IDS = [
  "0201256-6", // YIT
  "1927400-1", // Kesko
  "0112038-9", // Nokia
  "0109862-8", // Kone
  "3160091-4", // Teleurakointi Sorsa Oy
];

const BusinessIdSearch: React.FC<BusinessIdSearchProps> = ({
  onCompanyFound,
  showCard = true,
  initialValue = "",
  buttonText = "Hae",
  placeholder = "Syötä Y-tunnus (esim. 1234567-8)",
  label = "Y-tunnus"
}) => {
  const [businessId, setBusinessId] = useState(initialValue);
  
  // Päivitä businessId kun initialValue muuttuu
  useEffect(() => {
    if (initialValue) {
      setBusinessId(initialValue);
    }
  }, [initialValue]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<YTJCompanyData | null>(null);
  const [isValidId, setIsValidId] = useState<boolean | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset states
    setError(null);
    setCompanyData(null);

    // Validate business ID format
    if (!businessId.trim()) {
      setError("Syötä Y-tunnus");
      return;
    }

    const isValid = isValidBusinessId(businessId);
    setIsValidId(isValid);

    if (!isValid) {
      setError("Virheellinen Y-tunnus");
      return;
    }

    setIsLoading(true);

    try {
      const data = await fetchYTJData(businessId);
      console.log("Company data received:", data); // Debug log

      // Make sure we have a company name
      if (!data.name) {
        console.warn("Company name not found in the response");
      }

      setCompanyData(data);

      if (onCompanyFound) {
        onCompanyFound(data);
      }

      toast({
        title: "Yritys löydetty",
        description: `${data.name || 'Yritys'} (${data.business_id})`,
      });
    } catch (err) {
      console.error("Error fetching company data:", err);
      const errorMessage = err instanceof Error ? err.message : "Yritystietojen haku epäonnistui";
      setError(errorMessage);

      // Show examples if there's any fetch error
      setShowExamples(true);

      toast({
        title: "Virhe",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBusinessId(value);

    // Reset validation when input changes
    if (isValidId !== null) {
      setIsValidId(null);
    }

    // Reset error when input changes
    if (error) {
      setError(null);
    }

    // Hide examples when input changes
    if (showExamples) {
      setShowExamples(false);
    }
  };

  const setExampleBusinessId = (id: string) => {
    setBusinessId(id);
    setIsValidId(true);
    setError(null);
    setShowExamples(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business-id" className="text-foreground">
            {label}
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-grow">
              <Input
                id="business-id"
                type="text"
                placeholder={placeholder}
                value={businessId}
                onChange={handleInputChange}
                className={`w-full pr-10 ${
                  isValidId === true ? "border-success" : 
                  isValidId === false ? "border-destructive" : ""
                }`}
              />
              {isValidId !== null && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidId ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isLoading || isValidId === false}
              className="whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {buttonText}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Palvelua käyttämällä hyväksyt <a href="https://www.aimiten.fi/arvento-free-ehdot" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Arvento Free -palvelun tilaus- ja sopimusehdot</a>
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Virhe</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showExamples && (
          <div className="mt-4">
            <Alert variant="default" className="bg-info/10 border-info/20">
              <Info className="h-4 w-4 text-info" />
              <AlertTitle className="text-info">Kokeile näitä toimivia Y-tunnuksia</AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  {EXAMPLE_BUSINESS_IDS.map((id) => (
                    <Button 
                      key={id} 
                      variant="outline" 
                      size="sm" 
                      className="mr-2 bg-background"
                      onClick={() => setExampleBusinessId(id)}
                    >
                      {id}
                    </Button>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </form>

      {showCard && companyData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{companyData.name || "Yritys"}</CardTitle>
            <CardDescription>Y-tunnus: {companyData.business_id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companyData.industry_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Toimiala</p>
                  <p>{companyData.industry_name} ({companyData.industry_code})</p>
                </div>
              )}

              {companyData.registration_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rekisteröity</p>
                  <p>{new Date(companyData.registration_date).toLocaleDateString('fi-FI')}</p>
                </div>
              )}

              {companyData.company_form && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Yritysmuoto</p>
                  <p>{companyData.company_form}</p>
                </div>
              )}

              {(companyData.street_address || companyData.postal_code || companyData.city) && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Osoite</p>
                  <p>
                    {companyData.street_address && <span>{companyData.street_address}, </span>}
                    {companyData.postal_code && <span>{companyData.postal_code} </span>}
                    {companyData.city && <span>{companyData.city}</span>}
                  </p>
                </div>
              )}

              {companyData.website && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verkkosivut</p>
                  <a 
                    href={
                      companyData.website.startsWith('http') 
                        ? companyData.website 
                        : `https://${companyData.website}`
                    } 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline">
                    {companyData.website}
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessIdSearch;