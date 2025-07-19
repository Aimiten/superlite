// src/components/calculator/BusinessValueCalculator.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Calculator, BarChart2, Search, Loader2, AlertCircle, TrendingUp, ChevronsUpDown, Mail, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CalculatorSlider } from "@/components/ui/CalculatorSlider";
import { CalculatorProgress } from "@/components/ui/CalculatorProgress";
import { EmailCalculatorDialog } from "./EmailCalculatorDialog";

// Erillinen komponentti tähtiarviointia varten
const StarRatingComponent = ({ valuationData }: { valuationData: any }) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const handleRating = (star: number) => {
    if (hasRated) {
      return;
    }
    // Haetaan database_record_id, joka tulee supabasesta tallennetun rivin id:nä
    if (valuationData?.database_record_id) {
      // Tietueen ID supabasessa
      const recordId = valuationData.database_record_id;
      // Tallennetaan ensin paikallisesti, jotta käyttöliittymä päivittyy heti
      setSelectedRating(star);
      setHasRated(true);
      localStorage.setItem(`rating_${recordId}`, star.toString());
      // Tallennetaan arvio suoraan tauluun käyttäen tietueen ID:tä
      supabase
        .from('free_calculator_results')
        .update({ rating: star })
        .eq('id', recordId)
        .then((response) => {
          // Vastaus käsitelty ilman konsolilokitusta
        })
        .catch(err => {
          // Virhetilanne käsitelty ilman konsolilokitusta
          // Virhetilanteessa ei kuitenkaan poisteta käyttäjän tekemää arviota käyttöliittymästä
        });
    }
  };
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => !hasRated && setHoveredRating(star)}
            onMouseLeave={() => !hasRated && setHoveredRating(null)}
            disabled={hasRated}
            className={`w-12 h-12 flex items-center justify-center rounded-md border-2 shadow-neumorphic transition-all 
              ${hasRated 
                ? (star <= (selectedRating || 0) 
                    ? 'text-warning border-warning/40 bg-warning/10' 
                    : 'text-muted-foreground border-border') 
                : (hoveredRating !== null 
                    ? (star <= (hoveredRating || 0) 
                        ? 'text-warning border-warning/40 bg-warning/10 hover:shadow-md hover:scale-110 cursor-pointer' 
                        : 'text-muted-foreground border-border hover:shadow-md hover:scale-110 cursor-pointer') 
                    : 'text-muted-foreground border-border hover:shadow-md hover:scale-110 cursor-pointer'
                )
              }`}
            aria-label={`Anna ${star} tähden arvio`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" stroke="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>
      {hasRated && (
        <p className="text-sm text-success font-medium">
          Kiitos arvioinnistasi!
        </p>
      )}
    </>
  );
};

interface BusinessValueCalculatorProps {
  prefilledCompany?: string;
  prefilledBusinessId?: string;
  showHeader?: boolean;
}

const BusinessValueCalculator = ({ 
  prefilledCompany = "", 
  prefilledBusinessId = "",
  showHeader = true 
}: BusinessValueCalculatorProps) => {
  const [activeTab, setActiveTab] = useState(prefilledBusinessId ? "business-id" : "company-name");
  const [businessId, setBusinessId] = useState(prefilledBusinessId);
  const [companyName, setCompanyName] = useState(prefilledCompany);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [valuationData, setValuationData] = useState<any | null>(null);
  const [revenueMultiplierValue, setRevenueMultiplierValue] = useState(50);
  const [evEbitMultiplierValue, setEvEbitMultiplierValue] = useState(50);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const { toast } = useToast();

  const validateBusinessId = (id: string): boolean => {
    const regex = /^\d{7}-\d$/;
    return regex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setValuationData(null);

    if (activeTab === "business-id") {
      if (!businessId) {
        setError("Syötä y-tunnus.");
        return;
      }
      if (!validateBusinessId(businessId)) {
        setError("Virheellinen y-tunnus. Oikea muoto on 7 numeroa, väliviiva ja tarkistenumero (esim. 1234567-8).");
        return;
      }
    } else {
      if (!companyName) {
        setError("Syötä yrityksen nimi.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enhanced-calculator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            businessId: activeTab === "business-id" ? businessId : null,
            companyName: activeTab === "company-name" ? companyName : null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Arvonmäärityksen laskenta epäonnistui palvelimella");
      }

      const multipliers = data?.multipliers;
      const revenueMult = multipliers?.revenue;
      const evEbitMult = multipliers?.evEbit;
      const calculations = data?.calculations;
      const companyInfo = data?.companyInfo;
      const financialData = data?.financialData;

      const hasValidRevenueMultipliers = revenueMult &&
        typeof revenueMult.min === 'number' &&
        typeof revenueMult.avg === 'number' &&
        typeof revenueMult.max === 'number';

      const hasValidEvEbitMultipliers = evEbitMult &&
        typeof evEbitMult.min === 'number' &&
        typeof evEbitMult.avg === 'number' &&
        typeof evEbitMult.max === 'number';

      const hasCompanyInfo = companyInfo &&
                             typeof companyInfo.name === 'string' && companyInfo.name !== "Ei löytynyt" &&
                             typeof companyInfo.businessId === 'string' && companyInfo.businessId !== "Ei löytynyt";

      const hasCalculations = calculations &&
                              typeof calculations.avgRevenue === 'number' &&
                              typeof calculations.avgOperatingProfit === 'number';

      const hasRevenueValuations = calculations?.revenueValuations &&
         typeof calculations.revenueValuations.min === 'number' &&
         typeof calculations.revenueValuations.max === 'number';

       const hasEvEbitValuations = calculations?.evEbitValuations &&
         typeof calculations.evEbitValuations.min === 'number' &&
         typeof calculations.evEbitValuations.max === 'number';

       const hasFinancialStructure = financialData &&
                                     Array.isArray(financialData.revenue) &&
                                     Array.isArray(financialData.operatingProfit);


      if (!hasCompanyInfo || !hasCalculations || !hasValidRevenueMultipliers || !hasValidEvEbitMultipliers || !hasRevenueValuations || !hasEvEbitValuations || !hasFinancialStructure) {
        console.error("Puutteellinen tai virheellinen data API:sta:", data);
        throw new Error("Yrityksen tietoja tai arvostuskertoimia ei löytynyt riittävästi tai ne olivat virheellisiä. Arvonmääritystä ei voitu laskea. Tarkista syöte tai yritä myöhemmin uudelleen.");
      }

      setValuationData(data);
      setRevenueMultiplierValue(50);
      setEvEbitMultiplierValue(50);

      toast({
        title: "Arvonmääritys valmis",
        description: "Yrityksesi arvonmääritys on laskettu onnistuneesti.",
      });

    } catch (err: any) {
      console.error("Virhe arvonmäärityksessä:", err);
      setError(err.message || "Arvonmäärityksen laskennassa tapahtui tuntematon virhe. Yritä uudelleen.");
      toast({
        title: "Virhe",
        description: err.message || "Arvonmäärityksen laskenta epäonnistui",
        variant: "destructive",
      });
      setValuationData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || !isFinite(value)) {
        return '-';
    }
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const resetForm = () => {
    setBusinessId("");
    setCompanyName("");
    setValuationData(null);
    setError("");
    setRevenueMultiplierValue(50);
    setEvEbitMultiplierValue(50);
  };

  const calculateCurrentValuation = (type: 'revenue' | 'evEbit', value: number): number => {
    if (!valuationData?.calculations?.revenueValuations || !valuationData?.calculations?.evEbitValuations) {
         return 0;
    }

    const valuations = type === 'revenue'
      ? valuationData.calculations.revenueValuations
      : valuationData.calculations.evEbitValuations;

    const min = typeof valuations?.min === 'number' ? valuations.min : 0;
    const max = typeof valuations?.max === 'number' ? valuations.max : 0;

    if (max < min) return min;

    return min + ((max - min) * (value / 100));
  };

  const getMultiplierDescription = (value: number): string => {
    if (value < 33) return "Konservatiivinen";
    if (value < 66) return "Keskiarvo";
    return "Optimistinen";
  };

  const getCurrentMultiplier = (type: 'revenue' | 'evEbit', value: number): number => {
     if (!valuationData?.multipliers?.revenue || !valuationData?.multipliers?.evEbit) {
       return 0;
     }

     const multipliers = type === 'revenue'
       ? valuationData.multipliers.revenue
       : valuationData.multipliers.evEbit;

     const min = typeof multipliers?.min === 'number' ? multipliers.min : 0;
     const max = typeof multipliers?.max === 'number' ? multipliers.max : 0;

     if (max < min) return min;

     return min + ((max - min) * (value / 100));
   };

  return (
    <div className="w-full">
      {!valuationData ? (
        <Card className="border shadow-neumorphic">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="h-6 w-6 text-primary" />
              <span>PK-yrityksen <span className="text-primary">arvonmäärityslaskuri</span></span>
            </CardTitle>
            <CardDescription className="text-base">
              Laske yrityksesi alustava arvo perustuen tuoreimpiin taloustietoihin ja toimialan arvostuskertoimiin.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="business-id" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Y-tunnus</span>
                  </TabsTrigger>
                  <TabsTrigger value="company-name" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Yrityksen nimi</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="business-id" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-id">Y-tunnus</Label>
                    <Input
                      id="business-id"
                      value={businessId}
                      onChange={(e) => setBusinessId(e.target.value)}
                      placeholder="esim. 1234567-8"
                      className="text-center font-medium text-lg py-6"
                    />
                    <p className="text-sm text-muted-foreground">
                      Muoto: 7 numeroa, väliviiva, 1 tarkistenumero (esim. 1234567-8)
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="company-name" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Yrityksen nimi</Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="esim. Acme Oy"
                      className="text-center font-medium text-lg py-6"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all py-6 text-lg text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Lasketaan arvonmääritystä...
                    </>
                  ) : (
                    <>
                      Laske arvonmääritys
                      <BarChart2 className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                {isLoading && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>Laskenta voi kestää 1-2 minuuttia, odota hetki.</p>
                    <p>Haemme useista lähteistä ajantasaiset taloustiedot ja arvostuskertoimet.</p>
                  </div>
                )}
                
                {!isLoading && (
                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    Laskenta hyödyntää julkisia taloustietoja ja toimialakohtaisia arvostuskertoimia. 
                    Prosessi kestää noin 1-2 minuuttia.
                  </div>
                )}
              </div>
            </form>
          </CardContent>
          <CardFooter className="border-t bg-muted flex justify-center text-sm text-muted-foreground px-6 py-4">
            Laskuri hyödyntää julkisia taloustietoja ja toimialakohtaisia arvostuskertoimia
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border shadow-neumorphic overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{valuationData.companyInfo.name}</CardTitle>
                  <CardDescription className="text-primary-foreground/80">
                    {valuationData.companyInfo.businessId} • {valuationData.companyInfo.industry || 'Toimiala ei tiedossa'}
                  </CardDescription>
                </div>
                <div className="bg-primary-foreground text-primary rounded-md px-3 py-1 text-sm font-medium">
                  {valuationData.companyInfo.size ? `${valuationData.companyInfo.size} ` : 'Koko ei tiedossa'}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="p-6 bg-white border-b">
                <h3 className="text-lg font-medium mb-4">Taloudelliset tunnusluvut</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Liikevaihto (3v keskiarvo)</h4>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(valuationData.calculations.avgRevenue)}
                    </p>
                    <div className="mt-2 space-y-1">
                      {valuationData.financialData.revenue.map((item: { year: string; value: number | null }, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.year}:</span>
                          <span className="font-medium">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Liiketulos (3v keskiarvo)</h4>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(valuationData.calculations.avgOperatingProfit)}
                    </p>
                    <div className="mt-2 space-y-1">
                      {valuationData.financialData.operatingProfit.map((item: { year: string; value: number | null }, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.year}:</span>
                          <span className="font-medium">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Arvonmäärityksen tulokset</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  <div className="bg-white border rounded-lg p-5 shadow-neumorphic">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-1 text-primary">
                        <TrendingUp className="h-4 w-4" />
                        Liikevaihtokerroin
                      </h4>
                      <span className="text-muted-foreground text-sm">
                        Kerroin: {getCurrentMultiplier('revenue', revenueMultiplierValue).toFixed(2)}x
                      </span>
                    </div>

                    <p className="text-4xl font-bold text-primary mb-6">
                      {formatCurrency(calculateCurrentValuation('revenue', revenueMultiplierValue))}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Konservatiivinen</span>
                        <span className="text-sm bg-primary/10 text-primary px-3 py-0.5 rounded-full">
                          {getMultiplierDescription(revenueMultiplierValue)}
                        </span>
                        <span className="text-sm text-muted-foreground">Optimistinen</span>
                      </div>

                      <CalculatorSlider
                        defaultValue={[50]}
                        max={100}
                        step={1}
                        value={[revenueMultiplierValue]}
                        onValueChange={(value) => setRevenueMultiplierValue(value[0])}
                      />

                      <div className="flex justify-between mt-2 text-sm">
                        <span>{(valuationData.multipliers.revenue.min).toFixed(2)}x</span>
                        <span>{(valuationData.multipliers.revenue.avg).toFixed(2)}x</span>
                        <span>{(valuationData.multipliers.revenue.max).toFixed(2)}x</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <p>{valuationData.multipliers.revenue.justification || 'Perustelua ei saatavilla.'}</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">Lähde: {valuationData.multipliers.revenue.source || 'Lähdettä ei saatavilla.'}</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-5 shadow-neumorphic">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-1 text-primary">
                        <ChevronsUpDown className="h-4 w-4" />
                        EV/EBIT-kerroin
                      </h4>
                      <span className="text-muted-foreground text-sm">
                        Kerroin: {getCurrentMultiplier('evEbit', evEbitMultiplierValue).toFixed(2)}x
                      </span>
                    </div>

                    <p className="text-4xl font-bold text-primary mb-6">
                      {formatCurrency(calculateCurrentValuation('evEbit', evEbitMultiplierValue))}
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Konservatiivinen</span>
                        <span className="text-sm bg-primary/10 text-primary px-3 py-0.5 rounded-full">
                          {getMultiplierDescription(evEbitMultiplierValue)}
                        </span>
                        <span className="text-sm text-muted-foreground">Optimistinen</span>
                      </div>

                      <CalculatorSlider
                        defaultValue={[50]}
                        max={100}
                        step={1}
                        value={[evEbitMultiplierValue]}
                        onValueChange={(value) => setEvEbitMultiplierValue(value[0])}
                      />

                      <div className="flex justify-between mt-2 text-sm">
                        <span>{(valuationData.multipliers.evEbit.min).toFixed(2)}x</span>
                        <span>{(valuationData.multipliers.evEbit.avg).toFixed(2)}x</span>
                        <span>{(valuationData.multipliers.evEbit.max).toFixed(2)}x</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <p>{valuationData.multipliers.evEbit.justification || 'Perustelua ei saatavilla.'}</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">Lähde: {valuationData.multipliers.evEbit.source || 'Lähdettä ei saatavilla.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* Tähtiarviointikomponentti */}
            <div className="px-6 py-4 border-t bg-muted">
              <h3 className="font-medium text-secondary mb-3">Miten hyvin onnistuimme?</h3>
              <p className="text-sm text-secondary/70 mb-3">Klikkaa tähteä antaaksesi arvion (1-5 tähteä)</p>
              <StarRatingComponent valuationData={valuationData} />
            </div>
            
            <CardFooter className="bg-muted border-t p-6">
              <div className="w-full flex flex-col gap-4">
                <Button onClick={resetForm} className="bg-background border border-primary text-primary hover:bg-primary/5 transition-all py-6">
                  Laske uusi arvonmääritys
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = 'https://tally.so/r/wQ4WOp';
                  }}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all py-6 text-primary-foreground"
                >
                  Tee tarkempi arvonmääritys
                </Button>
                <Button
                  onClick={() => setIsEmailDialogOpen(true)}
                  className="bg-background border border-primary text-primary hover:bg-primary/5 transition-all py-6 flex items-center justify-center gap-2"
                >
                  <Mail className="h-5 w-5" />
                  Lähetä tulokset sähköpostiin
                </Button>
                <div className="text-center text-sm text-muted-foreground mt-2">
                  <p>Tämä arvonmääritys on alustava arvio, joka perustuu julkisiin tietoihin ja toimialan keskiarvoihin.</p>
                  <p className="mt-1">Tarkempaa arvonmääritystä varten suosittelemme käyttämään maksullisia versioita.</p>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {valuationData && (
        <EmailCalculatorDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          valuationData={valuationData}
          emailType="business_calculator"
        />
      )}
    </div>
  );
};

export default BusinessValueCalculator;