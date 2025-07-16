import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileUp, Calculator, ArrowRight, Info, Shield, CheckCircle, Zap, FileText, ArrowDown } from "lucide-react"; // Added ArrowDown and FileText imports
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FreeValuationCalculator from "@/components/free-valuation/FreeValuationCalculator";
import FreeValuationResults from "@/components/free-valuation/FreeValuationResults";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BusinessIdSearch from "@/components/company/BusinessIdSearch";
import { YTJCompanyData } from "@/utils/ytj-service";
import Header from "@/components/landing/Header";
import StarRatingComponent from "@/components/shared/StarRatingComponent";

type InputMethod = "upload" | "manual";
type CalculationStatus = "idle" | "loading" | "complete" | "error";

const FreeValuation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [companyId, setCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [companyData, setCompanyData] = useState<YTJCompanyData | null>(null);
  const [manuallyChangingCompany, setManuallyChangingCompany] = useState(false); // Added state to track manual changes

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
      }
    };
    
    checkAuth();
  }, []);

  const handleNavigation = () => {
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  // Lue businessId URL-parametrista kun sivu latautuu
  useEffect(() => {
    const businessIdFromUrl = searchParams.get('businessId');

    if (businessIdFromUrl && !manuallyChangingCompany) {
      console.log("Y-tunnus löydetty URL:sta:", businessIdFromUrl);
      setCompanyId(businessIdFromUrl);
      // Ei tehdä automaattista hakua, vaan jätetään tunnus vain kenttään
    }
  }, [searchParams, manuallyChangingCompany]);
  const [inputMethod, setInputMethod] = useState<InputMethod>("upload");
  const [calculationStatus, setCalculationStatus] = useState<CalculationStatus>("idle");
  const [valuationResults, setValuationResults] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isShowingQuestions, setIsShowingQuestions] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast({
        title: "Tiedosto valittu",
        description: `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)`,
      });
    }
  };

  const handleCompanyFound = (company: YTJCompanyData) => {
    setCompanyData(company);
    setCompanyName(company.name || '');
    setCompanyId(company.business_id);
    setManuallyChangingCompany(false); // Reset manuallyChangingCompany after successful search

    toast({
      title: "Yritystiedot haettu",
      description: `${company.name || 'Yritys'} (Y-tunnus: ${company.business_id})`,
    });

    console.log("Company name set:", company.name); // Debug log
  };

  const resetForm = () => {
    setCompanyId("");
    setCompanyName("");
    setCompanyData(null);
    setInputMethod("upload");
    setFile(null);
    setFinancialData(null);
    setValuationResults(null);
    setCalculationStatus("idle");
    setIsShowingQuestions(false); // Reset questions state on form reset
    setManuallyChangingCompany(false); // Reset manuallyChangingCompany on form reset
  };

  console.log("Current company name state:", companyName);

  const benefits = [
    {
      icon: <Calculator className="h-4 w-4 text-primary" />,
      title: "Nopea arvio",
      description: "Saat suuntaa-antavan arvion yrityksesi arvosta muutamassa minuutissa."
    },
    {
      icon: <CheckCircle className="h-4 w-4 text-success" />,
      title: "Helppo käyttää",
      description: "Voit ladata tilinpäätöksen tai syöttää tiedot manuaalisesti."
    },
    {
      icon: <Shield className="h-4 w-4 text-info" />,
      title: "Turvallinen",
      description: "Kaikki tietosi käsitellään turvallisesti ja luottamuksellisesti."
    }
  ];

  return (
    <div className="min-h-screen bg-muted/10">
      <Header 
        isLoggedIn={isLoggedIn}
        handleNavigation={handleNavigation}
        customLinks={[
          { label: "Etusivu", href: "/" },
          { label: "Ilmainen arvonmääritys", href: "/free-valuation" }
        ]}
        useNavigation={true}
      />

      {!companyData && (
        <section className="bg-gradient-to-b from-white to-muted/10 border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-2 bg-white text-primary border-primary/20 px-3 py-1 rounded-full">
                Ilmainen työkalu
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-2">
                Selvitä yrityksesi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">arvo</span> nopeasti
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
                Saat helposti alustavan arvion yrityksesi markkina-arvosta lataamalla tilinpäätöksen tai syöttämällä talousluvut.
              </p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-neumorphic border border-muted hover:shadow-neumorphic transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-8 h-8 bg-muted/10 rounded-full flex items-center justify-center mb-2">
                        {benefit.icon}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <main className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 ${companyData ? "pt-2" : "py-6 md:py-8"}`}>
        {calculationStatus !== "complete" ? (
          <div className="bg-white shadow-neumorphic rounded-2xl border border-muted overflow-hidden">
            {!companyName && (
              <div className="p-6 sm:p-8 border-b border-muted">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Aloita arvonmääritys</h2>
                  <p className="mt-2 text-muted-foreground">
                    Hae ensin yritys Y-tunnuksella, lataa sitten tilinpäätös tai syötä tarvittavat tiedot manuaalisesti.                
                  </p>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8">
              {!companyData ? (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-4">Hae yritys Y-tunnuksella</h3>
                  <BusinessIdSearch 
                    onCompanyFound={handleCompanyFound} 
                    showCard={true}
                    initialValue={companyId}
                    buttonText="Hae yritys"
                    placeholder="Syötä yrityksen Y-tunnus"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        {companyData.name || "Yritys"}
                      </span> arvonmääritys
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => {setCompanyData(null); setManuallyChangingCompany(true);}}> {/* Added setManuallyChangingCompany(true) */}
                      Vaihda yritystä
                    </Button>
                  </div>
                  <Card className="bg-white border-2 border-primary/10 shadow-neumorphic">
                    <CardContent className="pt-6">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-lg mr-3">
                          {(companyData.name || "Y").charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xl font-semibold">{companyData.name || "Yritys"}</h4>
                          <p className="text-muted-foreground">Y-tunnus: {companyData.business_id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {companyData.industry_name && (
                          <div className="bg-muted/10 p-3 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Toimiala</p>
                            <p className="font-medium">{companyData.industry_name}</p>
                          </div>
                        )}

                        {(companyData.street_address || companyData.postal_code || companyData.city) && (
                          <div className="bg-muted/10 p-3 rounded-lg">
                            <p className="text-sm font-medium text-muted-foreground">Osoite</p>
                            <p className="font-medium">
                              {companyData.street_address && <span>{companyData.street_address}, </span>}
                              {companyData.postal_code && <span>{companyData.postal_code} </span>}
                              {companyData.city && <span>{companyData.city}</span>}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {companyData && (
                <>


                  {!isShowingQuestions && (
                    <Tabs defaultValue="" className="mb-8">
                      <TabsList className="grid grid-cols-2 mb-6">
                        <TabsTrigger value="instructions">Ohjeet</TabsTrigger>
                        <TabsTrigger value="privacy">Tietosuoja</TabsTrigger>
                      </TabsList>

                      <TabsContent value="">
                        {/* Tyhjä sisältö, ei mitään näkyvillä oletuksena */}
                      </TabsContent>

                      <TabsContent value="instructions" className="space-y-4">
                        <div className="bg-muted/10 rounded-lg p-4 border border-muted">
                          <h3 className="font-semibold text-foreground mb-2">Näin saat arvion yrityksesi arvosta:</h3>
                          <ol className="space-y-2 text-foreground">
                            <li className="flex items-start gap-2">
                              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">1</span>
                              <span>Valitse yrityksesi tilinpäätös PDF-tiedostona tai syötä tiedot manuaalisesti.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">2</span>
                              <span>Järjestelmä analysoi tiedot ja laskee arvion käyttäen eri arvostusmenetelmiä.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">3</span>
                              <span>Saat valmiin yhteenvedon, joka sisältää arvion yrityksesi arvosta ja tärkeimmät tunnusluvut.</span>
                            </li>
                          </ol>
                        </div>

                        <div className="bg-warning/10 rounded-lg p-4 border border-warning/20">
                          <div className="flex gap-2 text-warning-foreground">
                            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Huomioithan, että kyseessä on alustava arvio.</p>
                              <p className="text-sm text-warning-foreground/80 mt-1">
                                Tämä arvio perustuu annettuihin tietoihin ja yleisiin arvostusmenetelmiin. Tarkemman arvonmäärityksen saat 
                                maksullisesta palvelustamme, joka huomioi myös toimialakohtaiset erityispiirteet.
                              </p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="privacy" className="space-y-4">
                        <div className="bg-muted/10 rounded-lg p-4 border border-muted">
                          <h3 className="font-semibold text-foreground mb-2">Tietosuoja ja tietojen käsittely:</h3>
                          <ul className="space-y-3 text-foreground">
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                              <span>Kaikki palvelun aikana asiakkaan toimittama tieto käsitellään ehdottoman luottamuksellisesti.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                              <span>Tiedot välitetään aina suojatun yhteyden kautta API-rajapintaa hyödyntäen prosessoitavaksi.</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                              <span>Anonymisoitua tietoa käytetään palvelun tuottamiseksi ja kehittämiseksi sekä vertailudatan tuottamiseksi.</span>
                            </li>
                          </ul>

                          <Separator className="my-4" />

                          <p className="text-sm text-muted-foreground">
                            Tarkemmat palvelun käyttöehdot ja lisätietoa  löydät <Link to="https://www.aimiten.fi/arvento-free-ehdot" className="text-primary hover:text-primary/80 hover:underline">täältä</Link>.
                          </p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}

                  <FreeValuationCalculator 
                    companyId={companyId}
                    setCompanyId={setCompanyId}
                    inputMethod={inputMethod}
                    setInputMethod={setInputMethod}
                    file={file}
                    handleFileUpload={handleFileUpload}
                    financialData={financialData}
                    setFinancialData={setFinancialData}
                    setCalculationStatus={setCalculationStatus}
                    setValuationResults={setValuationResults}
                    companyName={companyName}
                    onQuestionsVisibilityChange={setIsShowingQuestions}
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-neumorphic rounded-2xl border border-muted overflow-hidden">
            <div className="p-6 sm:p-8">
              <FreeValuationResults 
                valuationResults={valuationResults} 
                resetForm={resetForm}
              />
              
              {/* Tähtiarviointikomponentti piilotettu */}
            </div>
          </div>
        )}
      </main>

      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 py-3 mb-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center p-3 bg-white rounded-xl shadow-neumorphic border border-primary/10">
            <div className="mb-1 sm:mb-0 sm:mr-3">
              <Zap className="h-7 w-7 text-warning" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-foreground mb-0.5">Tarvitsetko tarkemman arvonmäärityksen?</h3>
              <p className="text-muted-foreground mb-1">
                Pian julkaistava maksullinen versio sisältää tarkemman arvonmäärityksen, myyntikunnon arvioinnin, toimialavertailut sekä paljon muuta hyödyllistä. Jätä sähköpostisi, niin kerromme heti, kun Arvento Lite on julkaistu!
              </p>
            </div>
            <div className="mt-1 sm:mt-0 sm:ml-auto">
              <Button 
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                onClick={() => window.open('https://tally.so/r/wQ4WOp', '_blank')}
              >
                Olen kiinnostunut!
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} Aimiten Oy. Kaikki oikeudet pidätetään.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FreeValuation;