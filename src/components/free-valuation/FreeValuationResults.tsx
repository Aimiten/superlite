
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Check, ArrowRight, Info, AlertTriangle } from "lucide-react";
import { ValuationNumbers, MyyntikuntoonRecommendation } from "./types";

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

  console.log("Rendering FreeValuationResults with:", valuationResults);

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
  
  // Extract company name from data structure
  const displayCompanyName = valuationResults?.companyName || "Tuntematon yritys";

  // Extract calculation values from the data structure
  const extractCalculationValues = (): ValuationNumbers => {
    console.log("Extracting calculation values from:", valuationResults);
    
    // Structure: data is in finalAnalysis.valuation_numbers
    if (valuationResults?.finalAnalysis?.valuation_numbers) {
      const values = valuationResults.finalAnalysis.valuation_numbers;
      console.log("Extracted valuation numbers from finalAnalysis:", values);
      
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
    console.log("No valuation data found, using empty structure");
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
  
  const calculationValues = extractCalculationValues();
  console.log("Final calculation values:", calculationValues);

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

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Arvonmäärityksen tulokset: {displayCompanyName}
        </h2>
        <p className="text-gray-600">
          Tämä on ilmainen, alustava arvio yrityksesi arvosta. Tarkemman analyysin saat käyttämällä Myyntikuntoon-palvelun maksullista versiota.
        </p>
      </div>

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
        <Card className="p-5 border">
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

      {/* Toimenpidesuositukset - Full Width */}
      {valuationResults.finalAnalysis?.recommendations && 
      valuationResults.finalAnalysis?.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Suositukset</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {valuationResults.finalAnalysis.recommendations.slice(0, 3).map((rec: any, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-indigo-700">{rec.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Myyntikuntoon-palvelun hyödyt - Completely Redesigned for Clean Layout */}
      {valuationResults.finalAnalysis?.myyntikuntoon_recommendation && (
        <Card className="overflow-hidden bg-white border border-indigo-100">
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

      {/* Varoitusilmoitukset - Full Width */}
      {(calculationValues.is_substanssi_negative || calculationValues.is_ebit_negative_or_zero) && (
        <Card className="p-5 border-amber-300 bg-amber-50/70">
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

      <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
        <Button 
          variant="outline" 
          onClick={handleTryAgain}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kokeile uudelleen
        </Button>
      </div>
    </div>
  );
};

export default FreeValuationResults;
