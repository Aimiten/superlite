import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Download, 
  Check, 
  ArrowRight, 
  Info, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  BarChart,
  Layers,
  Clipboard,
  RefreshCw,
  ExternalLink,
  Mail
} from "lucide-react";
import { ValuationNumbers, MyyntikuntoonRecommendation } from "./types";
import StarRatingComponent from "@/components/shared/StarRatingComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmailValuationDialog } from "./EmailValuationDialog";

interface FreeValuationResultsProps {
  valuationResults: any;
  resetForm: () => void;
}

const FreeValuationResults: React.FC<FreeValuationResultsProps> = ({
  valuationResults,
  resetForm,
}) => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showNormalizationDetails, setShowNormalizationDetails] = useState(false);
  const [showCalculationExplanations, setShowCalculationExplanations] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State for the dialog

  const handleTryAgain = () => {
    resetForm();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('fi-FI', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  // Extract company name from data structure
  const displayCompanyName = valuationResults?.companyName || "Tuntematon yritys";

  // Extract calculation values from the data structure
  const extractCalculationValues = (): ValuationNumbers => {
    // Structure: data is in finalAnalysis.valuation_numbers
    if (valuationResults?.finalAnalysis?.valuation_numbers) {
      const values = valuationResults.finalAnalysis.valuation_numbers;

      return {
        substanssi_value: values.substanssi_value || 0,
        is_substanssi_negative: values.is_substanssi_negative || false,
        ev_liikevaihto_value: values.ev_liikevaihto_value || 0,
        ev_ebit_value: values.ev_ebit_value || 0,
        is_ebit_negative_or_zero: values.is_ebit_negative_or_zero || false,
        ev_kerroin: values.ev_kerroin || 0,
        ev_ebit_ratio: values.ev_ebit_ratio || 0,
        range: {
          low: values.range?.low || 0,
          high: values.range?.high || 0
        }
      };
    }

    // Fallback to empty structure if no valuation numbers are found
    return {
      substanssi_value: 0,
      is_substanssi_negative: false,
      ev_liikevaihto_value: 0,
      ev_ebit_value: 0,
      is_ebit_negative_or_zero: false,
      ev_kerroin: 0,
      ev_ebit_ratio: 0,
      range: {
        low: 0,
        high: 0
      }
    };
  };

  // Extract financial metrics from the data structure
  const extractFinancialMetrics = () => {
    // Primary location - should be guaranteed if using extractFinancialData from server
    if (valuationResults?.tilinpaatos) {
      const financials = valuationResults.tilinpaatos;
      return {
        liikevaihto: financials.tuloslaskelma?.liikevaihto || 0,
        liikevoitto: financials.tuloslaskelma?.liikevoitto || 0,
        liikevoittoProsentti: financials.tuloslaskelma?.liikevoitto && financials.tuloslaskelma?.liikevaihto
          ? (financials.tuloslaskelma.liikevoitto / financials.tuloslaskelma.liikevaihto * 100)
          : 0,
        taseLoppusumma: 
          (financials.tase?.pysyvat_vastaavat?.aineelliset_kayttoomaisuuserat || 0) + 
          (financials.tase?.pysyvat_vastaavat?.aineettomat_hyodykkeet || 0) + 
          (financials.tase?.pysyvat_vastaavat?.muut || 0) + 
          (financials.tase?.vaihtuvat_vastaavat || 0),
        omavaraisuusaste: 
          (financials.tase?.pysyvat_vastaavat?.aineelliset_kayttoomaisuuserat || 0) + 
          (financials.tase?.pysyvat_vastaavat?.aineettomat_hyodykkeet || 0) + 
          (financials.tase?.pysyvat_vastaavat?.muut || 0) + 
          (financials.tase?.vaihtuvat_vastaavat || 0) - 
          (financials.tase?.velat?.lyhytaikaiset || 0) - 
          (financials.tase?.velat?.pitkataikaiset || 0),
        kokonaisVelka: 
          (financials.tase?.velat?.lyhytaikaiset || 0) + 
          (financials.tase?.velat?.pitkataikaiset || 0)
      };
    }

    // For manual inputs, we know the exact structure from server
    if (valuationResults?.finalAnalysis?.valuation_numbers) {
      // We can reconstruct basic metrics from valuation numbers
      const values = valuationResults.finalAnalysis.valuation_numbers;
      const manualRevenue = values.ev_liikevaihto_value / values.ev_kerroin;
      const manualEbit = values.is_ebit_negative_or_zero ? 0 : values.ev_ebit_value / values.ev_ebit_ratio;

      return {
        liikevaihto: manualRevenue || 0,
        liikevoitto: manualEbit || 0, 
        liikevoittoProsentti: manualRevenue > 0 ? ((manualEbit / manualRevenue) * 100) : 0,
        taseLoppusumma: Math.abs(values.substanssi_value) + values.range.high || 0,
        omavaraisuusaste: values.substanssi_value || 0,
        kokonaisVelka: values.is_substanssi_negative ? Math.abs(values.substanssi_value) : 0
      };
    }

    // Return empty structure as last resort
    return {
      liikevaihto: 0,
      liikevoitto: 0, 
      liikevoittoProsentti: 0,
      taseLoppusumma: 0,
      omavaraisuusaste: 0,
      kokonaisVelka: 0
    };
  };

  // Extract normalization information
  const extractNormalizationInfo = () => {
    // Haetaan tiedot ensisijaisesti backendin palauttamassa muodossa
    if (valuationResults?.normalization?.status) {
      return valuationResults.normalization.status;
    }

    // Tarkistetaan myös muut mahdolliset sijainnit
    if (valuationResults?.finalAnalysis?.normalization?.status) {
      return valuationResults.finalAnalysis.normalization.status;
    }

    return null;
  };

  const calculationValues = extractCalculationValues();
  const financialMetrics = extractFinancialMetrics();
  const normalizationInfo = extractNormalizationInfo();

  if (!valuationResults) {
    return (
      <div className="text-center py-8">
        <p>Tuloksia ei ole saatavilla.</p>
        <Button onClick={handleTryAgain} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Takaisin
        </Button>
      </div>
    );
  }

  // Determine if we can display valid valuation range
  const hasValidValuationRange = 
    calculationValues.range.low > 0 || 
    calculationValues.range.high > 0;

  try {
    // Fallback perusrakenne, jos odotettua dataa ei löydy
    if (!valuationResults || !valuationResults.finalAnalysis) {
      return (
        <div className="p-4 bg-red-50 border border-red-300 rounded">
          <h3 className="text-red-700">Odottamaton tietorakenne</h3>
          <pre className="mt-2 text-xs overflow-auto max-h-64">
            {JSON.stringify(valuationResults, null, 2)}
          </pre>
          <Button onClick={resetForm} className="mt-4">Aloita alusta</Button>
        </div>
      );
    }

    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header with company name and description */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              {displayCompanyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {displayCompanyName} <span className="text-lg font-normal text-gray-500">| Arvonmääritys</span>
              </h2>
              <p className="text-gray-600 text-sm">
                Laadittu {new Date().toLocaleDateString('fi-FI')} | Ilmainen, alustava arvio
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <p className="text-gray-600">
              Tämä on ilmainen, alustava arvio yrityksesi arvosta. Tarkemman analyysin ja toimenpidesuositukset saat pian käyttämällä <span className="font-semibold text-indigo-600">Arvento Lite ja Pro</span> -versioita.
            </p>
          </div>
        </div>

      {/* Tab navigation for different content sections */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" /> Yhteenveto
          </TabsTrigger>
          <TabsTrigger value="financials" className="flex items-center gap-1">
            <BarChart className="h-4 w-4" /> Tunnusluvut
          </TabsTrigger>
          <TabsTrigger value="normalization" className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4" /> Normalisointi
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1">
            <Clipboard className="h-4 w-4" /> Suositukset
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview">
          {/* UUSI JÄRJESTYS: 2x2 Grid laskelmille */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Substanssiarvo */}
            <Card className={`p-4 border ${calculationValues.is_substanssi_negative ? 'border-amber-300 bg-amber-50' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">Substanssiarvo</h3>
                  {calculationValues.is_substanssi_negative && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className={`text-xl font-semibold ${calculationValues.is_substanssi_negative ? 'text-amber-700' : ''}`}>
                  {calculationValues.is_substanssi_negative 
                    ? `${formatCurrency(calculationValues.substanssi_value * -1)} (negatiivinen)` 
                    : formatCurrency(calculationValues.substanssi_value)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calculationValues.is_substanssi_negative 
                  ? "Velat ylittävät yrityksen varat. Tämä voi vaikuttaa arvoon negatiivisesti."
                  : "Perustuu yrityksen varallisuuteen ja velkoihin"}
              </p>
            </Card>

            {/* EV/Revenue-arvostus */}
            <Card className="p-4 border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">EV/Revenue-arvostus</h3>
                </div>
                <div className="text-xl font-semibold">
                  {formatCurrency(calculationValues.ev_liikevaihto_value)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Perustuu yrityksen liikevaihtoon ja toimialan kertoimeen ({calculationValues.ev_kerroin.toFixed(1)}x)
              </p>
            </Card>

            {/* EV/EBIT-arvostus */}
            <Card className={`p-4 border ${calculationValues.is_ebit_negative_or_zero ? 'border-amber-300 bg-amber-50' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">EV/EBIT-arvostus</h3>
                  {calculationValues.is_ebit_negative_or_zero && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="text-xl font-semibold">
                  {calculationValues.is_ebit_negative_or_zero 
                    ? "Ei laskettavissa" 
                    : formatCurrency(calculationValues.ev_ebit_value)}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {calculationValues.is_ebit_negative_or_zero 
                  ? "Ei laskettavissa, koska liikevoitto (EBIT) on negatiivinen tai nolla" 
                  : `Perustuu yrityksen kykyyn tuottaa liikevoittoa (kerroin ${calculationValues.ev_ebit_ratio.toFixed(1)}x)`}
              </p>
            </Card>

            {/* Arvon vaihteluväli */}
            <Card className={`p-4 ${hasValidValuationRange ? 'border-2 border-green-100 bg-green-50/30' : 'border-amber-300 bg-amber-50'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">Arvon vaihteluväli</h3>
                  {!hasValidValuationRange && (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className={`${hasValidValuationRange ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'} px-3 py-1 rounded-full text-sm font-medium`}>
                  Yhteenveto
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">
                {hasValidValuationRange
                  ? `${formatCurrency(calculationValues.range.low)} - ${formatCurrency(calculationValues.range.high)}` 
                  : "Ei laskettavissa"}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {hasValidValuationRange
                  ? "Arvio perustuu sekä varallisuuteen että tuloksentekokykyyn"
                  : "Arvoa ei voida laskea luotettavasti, koska taloudelliset mittarit ovat negatiivisia tai nollia"}
              </p>
            </Card>
          </div>

          {/* Keskeiset havainnot - Full Width */}
          {valuationResults.finalAnalysis?.key_points && (
            <Card className="p-5 border mt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-slate-800 mb-2 text-lg">
                    {valuationResults.finalAnalysis.key_points.title || "Keskeiset havainnot"}
                  </h3>
                  <p className="text-slate-600">{valuationResults.finalAnalysis.key_points.content}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Laskentaperusteet expandable section */}
          <div className="mt-6">
            <button
              onClick={() => setShowCalculationExplanations(!showCalculationExplanations)}
              className="flex w-full items-center justify-between bg-slate-50 p-4 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-slate-800">Laskentaperusteet</span>
              </div>
              {showCalculationExplanations ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </button>

            {showCalculationExplanations && (
              <Card className="p-5 mt-2 border-slate-200 bg-white">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">Substanssiarvo</h4>
                    <p className="text-sm text-slate-600">
                      Substanssiarvo on yrityksen varojen ja velkojen erotus. Laskennassa huomioidaan yrityksen taseessa olevat varat ja velat.
                      Kaava: Substanssiarvo = Yrityksen varat - Yrityksen velat
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">EV/Revenue-arvostus</h4>
                    <p className="text-sm text-slate-600">
                      EV/Revenue-arvostus perustuu yrityksen liikevaihtoon ja toimialan mukaiseen kertoimeen.
                      Kaava: EV/Revenue-arvo = Liikevaihto × Toimialan kerroin ({calculationValues.ev_kerroin.toFixed(2)})
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">EV/EBIT-arvostus</h4>
                    <p className="text-sm text-slate-600">
                      EV/EBIT-arvostus perustuu yrityksen liikevoittoon (EBIT) ja toimialan mukaiseen kertoimeen.
                      Kaava: EV/EBIT-arvo = Liikevoitto (EBIT) × Toimialan kerroin ({calculationValues.ev_ebit_ratio.toFixed(2)})
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-slate-800 mb-1">Arvon vaihteluväli</h4>
                    <p className="text-sm text-slate-600">
                      Arvon vaihteluväli muodostuu eri arvonmääritysmenetelmien antamien tulosten pohjalta.
                      Vaihteluvälin alaraja on yleensä substanssiarvo (jos positiivinen) ja yläraja korkein saatava arvo eri menetelmillä.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Varoitusilmoitukset - Full Width */}
          {(calculationValues.is_substanssi_negative || calculationValues.is_ebit_negative_or_zero) && (
            <Card className="p-5 border-amber-300 bg-amber-50/70 mt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-amber-800 mb-2">Huomioitavaa arvonmäärityksessä</h3>
                  <div className="space-y-3 text-amber-700">
                    {calculationValues.is_substanssi_negative && (
                      <p>Yrityksesi substanssiarvo on negatiivinen, mikä tarkoittaa että velat ylittävät varat. Tämä vaikuttaa merkittävästi yrityksen arvoon.</p>
                    )}
                    {calculationValues.is_ebit_negative_or_zero && (
                      <p>Yrityksesi liikevoitto (EBIT) on negatiivinen tai nolla, minkä vuoksi EV/EBIT-arvostusta ei voida laskea. Ostajat kiinnittävät erityistä huomiota tuloksentekokykyyn.</p>
                    )}
                    <p className="font-medium">Maksullisessa palvelussamme saat tarkemman analyysin ja toimenpidesuositukset tilanteen parantamiseksi.</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Financials Tab Content */}
        <TabsContent value="financials">
          <Card className="p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart className="h-5 w-5 text-indigo-600" />
              Taloudelliset tunnusluvut
            </h3>

            {(financialMetrics.liikevaihto > 0 || financialMetrics.liikevoitto > 0 || financialMetrics.taseLoppusumma > 0) ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Liikevaihto */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="text-sm text-slate-500 mb-1">Liikevaihto</h4>
                    <p className="text-xl font-semibold text-slate-900">{formatCurrency(financialMetrics.liikevaihto)}</p>
                  </div>

                  {/* Liikevoitto (EBIT) */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="text-sm text-slate-500 mb-1">Liikevoitto (EBIT)</h4>
                    <p className="text-xl font-semibold text-slate-900">{formatCurrency(financialMetrics.liikevoitto)}</p>
                  </div>

                  {/* Liikevoitto-% */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="text-sm text-slate-500 mb-1">Liikevoitto-%</h4>
                    <p className="text-xl font-semibold text-slate-900">
                      {financialMetrics.liikevaihto > 0 ? `${((financialMetrics.liikevoitto / financialMetrics.liikevaihto) * 100).toFixed(1)} %` : '0,0 %'}
                    </p>
                  </div>
                </div>

                {/* Link to financial analysis sections */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <h4 className="font-medium text-slate-800 mb-3">Taloudelliset analyysit</h4>

                  {valuationResults.finalAnalysis?.valuation_analysis && (
                    <div className="space-y-4">
                      {/* Substanssiarvo analysis */}
                      {valuationResults.finalAnalysis.valuation_analysis.substanssi_analysis && (
                        <Card className="p-4 border-l-4 border-l-indigo-600 hover:bg-slate-50 transition-colors">
                          <h5 className="font-medium text-slate-900 mb-2">
                            {valuationResults.finalAnalysis.valuation_analysis.substanssi_analysis.title || "Substanssiarvon analyysi"}
                          </h5>
                          <p className="text-sm text-slate-600">
                            {valuationResults.finalAnalysis.valuation_analysis.substanssi_analysis.content}
                          </p>
                        </Card>
                      )}

                      {/* EV/Revenue analysis */}
                      {valuationResults.finalAnalysis.valuation_analysis.ev_revenue_analysis && (
                        <Card className="p-4 border-l-4 border-l-indigo-600 hover:bg-slate-50 transition-colors">
                          <h5 className="font-medium text-slate-900 mb-2">
                            {valuationResults.finalAnalysis.valuation_analysis.ev_revenue_analysis.title || "EV/Revenue-arvon analyysi"}
                          </h5>
                          <p className="text-sm text-slate-600">
                            {valuationResults.finalAnalysis.valuation_analysis.ev_revenue_analysis.content}
                          </p>
                        </Card>
                      )}

                      {/* EV/EBIT analysis */}
                      {valuationResults.finalAnalysis.valuation_analysis.ev_ebit_analysis && (
                        <Card className="p-4 border-l-4 border-l-indigo-600 hover:bg-slate-50 transition-colors">
                          <h5 className="font-medium text-slate-900 mb-2">
                            {valuationResults.finalAnalysis.valuation_analysis.ev_ebit_analysis.title || "EV/EBIT-arvon analyysi"}
                          </h5>
                          <p className="text-sm text-slate-600">
                            {valuationResults.finalAnalysis.valuation_analysis.ev_ebit_analysis.content}
                          </p>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <BarChart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Yksityiskohtaiset taloudelliset tiedot puuttuvat</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Tässä ilmaisessa versiossa näytetään vain perustason taloudelliset tiedot. 
                  Kattavamman analyysin saat Myyntikuntoon-palvelun maksullisessa versiossa.
                </p>

                <div className="mt-6 bg-indigo-50 p-4 rounded-lg max-w-lg mx-auto">
                  <h4 className="font-medium text-indigo-800 mb-2">Maksullisessa versiossa saat:</h4>
                  <ul className="space-y-2 text-left list-disc list-inside text-indigo-700">
                    <li>Kattavan taloudellisen analyysin yrityksen tunnusluvuista</li>
                    <li>Toimialavertailun keskeisistä tunnusluvuista</li>
                    <li>Trendianalyysin tunnuslukujen kehityksestä</li>
                    <li>Yksityiskohtaiset graafit ja visualisoinnit</li>
                  </ul>

                  <Link to="/auth" className="block mt-4">
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 h-auto font-medium"
                    >
                      Hanki kattava taloudellinen analyysi
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Normalization Tab Content */}
        <TabsContent value="normalization">
          <Card className="p-6 border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-600" />
              Tilinpäätöstietojen normalisointi
            </h3>

            {normalizationInfo ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-800 mb-2">Normalisoinnin vaikutus</h4>
                  <p className="text-slate-600">{normalizationInfo.normalization_impact}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Omistajan palkka */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-indigo-50 p-3 border-b">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-slate-800">Omistajan palkka</h5>
                        {normalizationInfo.owner_salary_normalized ? (
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                            Normalisoitu
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                            Ei muutoksia
                          </span>
                        )}
                      </div>
                    </div>

                    {normalizationInfo.owner_salary_normalized && (
                      <div className="p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Alkuperäinen</p>
                            <p className="font-medium text-slate-900">
                              {formatCurrency(normalizationInfo.original_values?.owner_salary || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Normalisoitu</p>
                            <p className="font-medium text-slate-900">
                              {formatCurrency(normalizationInfo.adjusted_values?.owner_salary || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toimitilakulut */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-indigo-50 p-3 border-b">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-slate-800">Toimitilakulut</h5>
                        {normalizationInfo.premises_costs_normalized ? (
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium">
                            Normalisoitu
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                            Ei muutoksia
                          </span>
                        )}
                      </div>
                    </div>

                    {normalizationInfo.premises_costs_normalized && (
                      <div className="p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Alkuperäinen</p><p className="font-medium text-slate-900">
                              {formatCurrency(normalizationInfo.original_values?.premises_costs || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Normalisoitu</p>
                            <p className="font-medium text-slate-900">
                              {formatCurrency(normalizationInfo.adjusted_values?.premises_costs || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Normalisoinnin vaikutus yrityksen arvoon */}
                <Card className="p-4 bg-indigo-50 border-indigo-100">
                  <h4 className="font-medium text-slate-800 mb-2">Normalisoinnin vaikutus yrityksen arvoon</h4>
                  <p className="text-slate-600">
                    Normalisoinnilla pyritään poistamaan tilinpäätöksestä sellaisia tekijöitä, jotka eivät kuvasta yrityksen todellista tuloksentekokykyä 
                    tai taloudellista asemaa. Tällaisia eriä ovat mm. omistajan palkka, joka voi olla yli tai alle markkinatason, sekä toimitilakulut, 
                    jotka voivat sisältää markkinatason poikkeavia vuokria tai omistajan omien kiinteistöjen kuluja.
                  </p>
                </Card>
              </div>
            ) : (
              <div className="text-center py-10">
                <RefreshCw className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ei normalisointitietoja saatavilla</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Normalisointi on tärkeä osa yrityksen arvonmääritystä. Sen avulla poistetaan tilinpäätöksestä poikkeukselliset erät,
                  jotka eivät kuvasta yrityksen todellista tuloksentekokykyä.
                </p>

                <div className="mt-6 bg-indigo-50 p-4 rounded-lg max-w-lg mx-auto">
                  <h4 className="font-medium text-indigo-800 mb-2">Saat maksullisessa versiossa:</h4>
                  <ul className="space-y-2 text-left list-disc list-inside text-indigo-700">
                    <li>Omistajan palkan normalisoinnin markkinatasoon</li>
                    <li>Toimitilakulujen oikaisun markkinatason mukaiseksi</li>
                    <li>Muiden poikkeuksellisten erien normalisoinnin</li>
                    <li>Tarkan vaikutusanalyysin yrityksen arvoon</li>
                  </ul>

                  <Link to="https://tally.so/r/wQ4WOp" className="block mt-4">
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 h-auto font-medium"
                    >
                      Hanki tarkempi analyysi
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Recommendations Tab Content */}
        <TabsContent value="recommendations">
          {/* Toimenpidesuositukset - Full Width */}
          {valuationResults.finalAnalysis?.recommendations && 
          valuationResults.finalAnalysis?.recommendations.length > 0 ? (
            <Card className="p-6 border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-indigo-600" />
                Suositukset
              </h3>
              <div className="grid gap-4">
                {valuationResults.finalAnalysis.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-5 bg-slate-50 rounded-lg border-l-4 border-l-indigo-600">
                    <h4 className="font-medium text-indigo-800 mb-2">{rec.title}</h4>
                    <p className="text-slate-600">{rec.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="p-6 border">
              <div className="text-center py-8">
                <Clipboard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ei suosituksia saatavilla</h3>
                <p className="text-slate-600">
                  Tarkemmat toimenpidesuositukset saat käyttämällä Myyntikuntoon-palvelun maksullista versiota.
                </p>
              </div>
            </Card>
          )}

          {/* Myyntikuntoon-palvelun hyödyt - Completely Redesigned for Clean Layout */}
          {valuationResults.finalAnalysis?.myyntikuntoon_recommendation && (
            <Card className="overflow-hidden bg-white border border-indigo-100 mt-6">
              <div className="flex flex-col">
                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-white">
                  <h3 className="text-xl font-bold">
                    {valuationResults.finalAnalysis.myyntikuntoon_recommendation.personalized_title || 
                    "Myyntikuntoon - Maksimoi yrityksesi arvo!"}
                  </h3>
                  <p className="mt-1 text-indigo-100">
                    {valuationResults.finalAnalysis.myyntikuntoon_recommendation.catchy_subtitle || 
                    "Ota seuraava askel ja nosta yrityksesi arvoa"}
                  </p>
                </div>

                {/* Content area */}
                <div className="p-6">
                  <p className="text-slate-700 mb-4">
                    {valuationResults.finalAnalysis.myyntikuntoon_recommendation.main_benefit_description || 
                    "Myyntikuntoon-palvelun maksullinen versio auttaa sinua parantamaan yrityksesi arvoa ja houkuttelevuutta potentiaalisten ostajien silmissä."}
                  </p>

                  {/* Benefits section with check marks */}
                  <div className="mb-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-slate-700 text-sm">
                        {valuationResults.finalAnalysis.myyntikuntoon_recommendation.bullet_points?.bullet_point_1 || 
                        "Saat tarkan analyysin yrityksesi arvosta ja kehityskohteista"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-slate-700 text-sm">
                        {valuationResults.finalAnalysis.myyntikuntoon_recommendation.bullet_points?.bullet_point_2 || 
                        "Vertaamme yrityksesi lukuja toimialan keskiarvoihin"}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-1 mt-0.5 flex-shrink-0">
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-slate-700 text-sm">
                        {valuationResults.finalAnalysis.myyntikuntoon_recommendation.bullet_points?.bullet_point_3 || 
                        "Saat konkreettisen toimenpidesuunnitelman arvon nostamiseksi"}
                      </p>
                    </div>
                  </div>

                  {/* Call to action button */}
                  <Link to="/auth">
                    <Button 
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg py-2 h-auto font-medium"
                    >
                      {valuationResults.finalAnalysis.myyntikuntoon_recommendation.call_to_action || 
                      "Aloita arvon parantaminen Myyntikuntoon-palvelulla"} 
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tähtiarviointikomponentti piilotettu */}

      <div className="flex flex-wrap items-center justify-between gap-4 mt-8 border-t pt-6">
        <Button 
          variant="outline" 
          onClick={handleTryAgain}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kokeile uudelleen
        </Button>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2 text-white">
          <Mail className="h-4 w-4" /> Lähetä sähköpostiin
        </Button>

        <div className="text-xs text-slate-500">
          Ilmainen arvonmääritys | Laajemmat analyysit Lite ja Pro saatavilla pian!
        </div>
      </div>
      <EmailValuationDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        valuationResults={valuationResults}
      />
    </div>
  );
  } catch (error) {
    console.error("Error rendering results:", error);
    return (
      <div className="p-4 bg-red-50 border border-red-300 rounded">
        <h3 className="text-red-700">Virhe tulosten näyttämisessä</h3>
        <p>{error instanceof Error ? error.message : "Tuntematon virhe"}</p>
        <Button onClick={resetForm} className="mt-4">Aloita alusta</Button>
      </div>
    );
  }
};

export default FreeValuationResults;