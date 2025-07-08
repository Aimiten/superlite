import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileUp, Calculator, ArrowRight, Info, Shield, CheckCircle, Zap } from "lucide-react";
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

type InputMethod = "upload" | "manual";
type CalculationStatus = "idle" | "loading" | "complete" | "error";

const FreeValuation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [companyId, setCompanyId] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [companyData, setCompanyData] = useState<YTJCompanyData | null>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>("upload");
  const [calculationStatus, setCalculationStatus] = useState<CalculationStatus>("idle");
  const [valuationResults, setValuationResults] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  
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
  };

  console.log("Current company name state:", companyName);

  const benefits = [
    {
      icon: <Calculator className="h-4 w-4 text-indigo-500" />,
      title: "Nopea arvio",
      description: "Saat suuntaa-antavan arvion yrityksesi arvosta muutamassa minuutissa."
    },
    {
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      title: "Helppo käyttää",
      description: "Voit ladata tilinpäätöksen tai syöttää tiedot manuaalisesti."
    },
    {
      icon: <Shield className="h-4 w-4 text-blue-500" />,
      title: "Turvallinen",
      description: "Kaikki tietosi käsitellään turvallisesti ja luottamuksellisesti."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-lg font-medium">Takaisin etusivulle</span>
          </Link>
          <div className="flex items-center gap-4">
            {companyName && (
              <div className="hidden md:flex items-center">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1">
                  {companyName}
                </Badge>
              </div>
            )}
            <Link to="/auth">
              <Button variant="outline" size="sm">Kirjaudu</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="text-center">
            {companyName ? (
              <div className="mb-2">
                <Badge variant="outline" className="mb-1 bg-white text-indigo-500 border-indigo-200 px-3 py-1 rounded-full">
                  Ilmainen työkalu
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight mb-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">{companyName}</span> arvonmääritys
                </h1>
              </div>
            ) : (
              <>
                <Badge variant="outline" className="mb-2 bg-white text-indigo-500 border-indigo-200 px-3 py-1 rounded-full">
                  Ilmainen työkalu
                </Badge>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight mb-2">
                  Selvitä yrityksesi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">arvo</span> nopeasti
                </h1>
              </>
            )}
            
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-4">
              Saat helposti alustavan arvion yrityksesi markkina-arvosta lataamalla tilinpäätöksen tai syöttämällä talousluvut.
            </p>
            
            {!companyData && (
              <div className="grid grid-cols-3 gap-4 mt-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        {benefit.icon}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 mb-1">{benefit.title}</h3>
                      <p className="text-xs text-slate-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {calculationStatus !== "complete" ? (
          <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100">
              {companyName ? (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                    {companyName} - Arvonmääritys
                  </h2>
                  <p className="mt-2 text-slate-600">
                    Lataa tilinpäätös tai syötä tiedot manuaalisesti aloittaaksesi.
                  </p>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Aloita arvonmääritys</h2>
                  <p className="mt-2 text-slate-600">
                    Hae ensin yritys Y-tunnuksella, sitten lataa tilinpäätös tai syötä tiedot manuaalisesti.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 sm:p-8">
              {!companyData ? (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Hae yritys Y-tunnuksella</h3>
                  <BusinessIdSearch 
                    onCompanyFound={handleCompanyFound} 
                    showCard={true}
                    buttonText="Hae yritys"
                    placeholder="Syötä yrityksen Y-tunnus"
                  />
                </div>
              ) : (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-slate-800">Yrityksen tiedot</h3>
                    <Button variant="outline" size="sm" onClick={() => setCompanyData(null)}>
                      Vaihda yritystä
                    </Button>
                  </div>
                  <Card className="bg-slate-50">
                    <CardContent className="pt-6">
                      <h4 className="text-xl font-semibold">{companyData.name || "Yritys"}</h4>
                      <p className="text-slate-500">Y-tunnus: {companyData.business_id}</p>
                      
                      {companyData.industry_name && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-slate-500">Toimiala</p>
                          <p>{companyData.industry_name}</p>
                        </div>
                      )}
                      
                      {(companyData.street_address || companyData.postal_code || companyData.city) && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-slate-500">Osoite</p>
                          <p>
                            {companyData.street_address && <span>{companyData.street_address}, </span>}
                            {companyData.postal_code && <span>{companyData.postal_code} </span>}
                            {companyData.city && <span>{companyData.city}</span>}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {companyData && (
                <>
                  <Tabs defaultValue="instructions" className="mb-8">
                    <TabsList className="grid grid-cols-2 mb-6">
                      <TabsTrigger value="instructions" className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Ohjeet</span>
                      </TabsTrigger>
                      <TabsTrigger value="privacy" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Tietosuoja</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="instructions" className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-2">Näin saat arvion yrityksesi arvosta:</h3>
                        <ol className="space-y-2 text-slate-700">
                          <li className="flex items-start gap-2">
                            <span className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">1</span>
                            <span>Valitse yrityksesi tilinpäätös PDF-tiedostona tai syötä tiedot manuaalisesti.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">2</span>
                            <span>Järjestelmä analysoi tiedot ja laskee arvion käyttäen eri arvostusmenetelmiä.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="bg-indigo-100 text-indigo-700 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">3</span>
                            <span>Saat valmiin yhteenvedon, joka sisältää arvion yrityksesi arvosta ja tärkeimmät tunnusluvut.</span>
                          </li>
                        </ol>
                      </div>
                      
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                        <div className="flex gap-2 text-amber-800">
                          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Huomioithan, että kyseessä on alustava arvio.</p>
                            <p className="text-sm text-amber-700 mt-1">
                              Tämä arvio perustuu annettuihin tietoihin ja yleisiin arvostusmenetelmiin. Tarkemman arvonmäärityksen saat 
                              maksullisesta palvelustamme, joka huomioi myös toimialakohtaiset erityispiirteet.
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="privacy" className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-2">Tietosuoja ja tietojen käsittely:</h3>
                        <ul className="space-y-3 text-slate-700">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Kaikki tiedot käsitellään luottamuksellisesti ja turvallisesti.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Ilman kirjautumista ladattuja tietoja ei tallenneta pysyvästi palvelimelle.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>Tietoja käytetään vain arvonmäärityksen tekemiseen, ei markkinointiin.</span>
                          </li>
                        </ul>
                        
                        <Separator className="my-4" />
                        
                        <p className="text-sm text-slate-600">
                          Tarkemman tietosuojaselosteen löydät <Link to="/privacy-policy" className="text-indigo-600 hover:text-indigo-800 hover:underline">täältä</Link>.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
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
                  />
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              <FreeValuationResults 
                valuationResults={valuationResults} 
                resetForm={resetForm}
              />
            </div>
          </div>
        )}
      </main>

      <section className="bg-gradient-to-r from-indigo-50 to-purple-50 py-3 mb-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center p-3 bg-white rounded-xl shadow-sm border border-indigo-100">
            <div className="mb-1 sm:mb-0 sm:mr-3">
              <Zap className="h-7 w-7 text-amber-500" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-800 mb-0.5">Tarvitsetko tarkemman arvonmäärityksen?</h3>
              <p className="text-slate-600 mb-1">
                Maksullinen versio sisältää tarkemman analyysin, toimialavertailut ja asiantuntijan tuen.
              </p>
            </div>
            <div className="mt-1 sm:mt-0 sm:ml-auto">
              <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                Tutustu Premium-versioon
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Myyntikuntoon. Kaikki oikeudet pidätetään.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FreeValuation;
