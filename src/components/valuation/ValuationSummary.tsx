
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calculator, FileBarChart, Info, Building, Landmark, TrendingUp } from "lucide-react";

interface ValuationSummaryProps {
  financialAnalysis: any;
  companyInfo: any;
}

const ValuationSummary: React.FC<ValuationSummaryProps> = ({ financialAnalysis, companyInfo }) => {
  // Extract company data from the responses
  const companyData = financialAnalysis?.company || {};
  const companyInfoData = companyInfo?.structuredData || {};
  
  // Extract financial periods from the first document
  const financialPeriods = financialAnalysis?.documents?.[0]?.financial_periods || [];
  const latestPeriod = financialPeriods[0]; // Take the most recent period
  
  // Format currency value with euro symbol
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return null;
    return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  // Format percentage value
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return null;
    return new Intl.NumberFormat('fi-FI', { style: 'percent', maximumFractionDigits: 1 }).format(value / 100);
  };

  // Check if we have valuation data
  const hasValuationData = latestPeriod?.valuations || latestPeriod?.valuation_multiples;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Badge variant="outline" className="mb-2 w-fit">Yrityksen tiedot</Badge>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2 text-indigo-600" />
            {companyData.name || companyInfoData.company_name || "Yritys"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(companyData.name || companyInfoData.company_name) && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Yrityksen nimi</h3>
                <p className="text-lg">{companyData.name || companyInfoData.company_name}</p>
              </div>
            )}
            
            {(companyData.business_id || companyInfoData.business_id) && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Y-tunnus</h3>
                <p className="text-lg">{companyData.business_id || companyInfoData.business_id}</p>
              </div>
            )}
            
            {companyInfoData.industry && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Toimiala</h3>
                <p className="text-lg">{companyInfoData.industry}</p>
              </div>
            )}
            
            {companyInfoData.employees && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Henkilöstö</h3>
                <p className="text-lg">{companyInfoData.employees}</p>
              </div>
            )}
          </div>
          
          {companyInfoData.description && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Kuvaus</h3>
              <p className="text-base mt-1">{companyInfoData.description}</p>
            </div>
          )}
          
          {companyInfoData.market_position && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Markkina-asema</h3>
              <p className="text-base mt-1">{companyInfoData.market_position}</p>
            </div>
          )}
          
          {Array.isArray(companyInfoData.competitive_advantages) && companyInfoData.competitive_advantages.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500">Kilpailuedut</h3>
              <ul className="list-disc pl-5 mt-1">
                {companyInfoData.competitive_advantages.map((advantage, index) => (
                  <li key={index}>{advantage}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      {latestPeriod && (
        <>
          <Card>
            <CardHeader>
              <Badge variant="outline" className="mb-2 w-fit">Taloudelliset tunnusluvut</Badge>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
                Tilinpäätösanalyysi
              </CardTitle>
              {latestPeriod.period && (
                <div className="text-sm text-slate-600">
                  Tilikausi: {new Date(latestPeriod.period.start_date).toLocaleDateString('fi-FI')} - {new Date(latestPeriod.period.end_date).toLocaleDateString('fi-FI')}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-base">Tuloslaskelma</h3>
                  
                  {latestPeriod.income_statement?.revenue !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Liikevaihto</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.income_statement?.revenue)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.income_statement?.materials_and_services !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Materiaalit ja palvelut</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.income_statement?.materials_and_services)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.income_statement?.personnel_expenses !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Henkilöstökulut</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.income_statement?.personnel_expenses)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.income_statement?.depreciation !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Poistot</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.income_statement?.depreciation)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.income_statement?.net_income !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Tilikauden tulos</h4>
                      <p className="text-lg font-medium">{formatCurrency(latestPeriod.income_statement?.net_income)}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-base">Tase</h3>
                  
                  {latestPeriod.balance_sheet?.assets_total !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Vastaavaa yhteensä</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.balance_sheet?.assets_total)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.balance_sheet?.equity !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Oma pääoma</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.balance_sheet?.equity)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.balance_sheet?.liabilities_total !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Vieras pääoma yhteensä</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.balance_sheet?.liabilities_total)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.dcf_items?.cash !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Rahat ja pankkisaamiset</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.dcf_items?.cash)}</p>
                    </div>
                  )}
                  
                  {latestPeriod.dcf_items?.interest_bearing_debt !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500">Korollinen velka</h4>
                      <p className="text-lg">{formatCurrency(latestPeriod.dcf_items?.interest_bearing_debt)}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-base">Lasketut tunnusluvut</h3>
                  
                  {latestPeriod.calculated_fields && (
                    <>
                      {latestPeriod.calculated_fields.ebit !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">EBIT (Liikevoitto)</h4>
                          <p className="text-lg">{formatCurrency(latestPeriod.calculated_fields.ebit)}</p>
                        </div>
                      )}
                      
                      {latestPeriod.calculated_fields.ebitda !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">EBITDA (Käyttökate)</h4>
                          <p className="text-lg">{formatCurrency(latestPeriod.calculated_fields.ebitda)}</p>
                        </div>
                      )}
                      
                      {latestPeriod.calculated_fields.free_cash_flow !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">Vapaa kassavirta</h4>
                          <p className="text-lg">{formatCurrency(latestPeriod.calculated_fields.free_cash_flow)}</p>
                        </div>
                      )}
                      
                      {latestPeriod.calculated_fields.roe !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">ROE (Oman pääoman tuotto)</h4>
                          <p className="text-lg">{formatPercentage(latestPeriod.calculated_fields.roe)}</p>
                        </div>
                      )}
                      
                      {latestPeriod.calculated_fields.equity_ratio !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">Omavaraisuusaste</h4>
                          <p className="text-lg">{formatPercentage(latestPeriod.calculated_fields.equity_ratio)}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {!latestPeriod.calculated_fields && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Tunnusluvut puuttuvat</AlertTitle>
                      <AlertDescription>
                        Laskettuja tunnuslukuja ei ole saatavilla. Tämä voi johtua puutteellisista tilinpäätöstiedoista.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {hasValuationData && (
            <Card>
              <CardHeader>
                <Badge variant="outline" className="mb-2 w-fit">Arvostuskertoimet ja arviot</Badge>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                  Yrityksen arvostuslaskelmat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {latestPeriod.valuation_multiples && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-base">Käytetyt arvostuskertoimet</h3>
                      
                      {latestPeriod.valuation_multiples.ev_ebit?.multiple && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">EV/EBIT-kerroin</h4>
                          <p className="text-lg">{latestPeriod.valuation_multiples.ev_ebit?.multiple}</p>
                          {latestPeriod.valuation_multiples.ev_ebit?.justification && (
                            <p className="text-xs text-slate-500">{latestPeriod.valuation_multiples.ev_ebit?.justification}</p>
                          )}
                        </div>
                      )}
                      
                      {latestPeriod.valuation_multiples.ev_ebitda?.multiple && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">EV/EBITDA-kerroin</h4>
                          <p className="text-lg">{latestPeriod.valuation_multiples.ev_ebitda?.multiple}</p>
                          {latestPeriod.valuation_multiples.ev_ebitda?.justification && (
                            <p className="text-xs text-slate-500">{latestPeriod.valuation_multiples.ev_ebitda?.justification}</p>
                          )}
                        </div>
                      )}
                      
                      {latestPeriod.valuation_multiples.p_e?.multiple && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">P/E-kerroin</h4>
                          <p className="text-lg">{latestPeriod.valuation_multiples.p_e?.multiple}</p>
                          {latestPeriod.valuation_multiples.p_e?.justification && (
                            <p className="text-xs text-slate-500">{latestPeriod.valuation_multiples.p_e?.justification}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {latestPeriod.valuations && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-base">Arvostusarviot</h3>
                      
                      {latestPeriod.valuations.ev_ebit_valuation !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">EV/EBIT-arvostus</h4>
                          <p className="text-lg font-medium">{formatCurrency(latestPeriod.valuations.ev_ebit_valuation)}</p>
                          <p className="text-xs text-slate-500">
                            Laskukaava: (EBIT × EV/EBIT-kerroin) + kassa - korollinen velka
                          </p>
                        </div>
                      )}
                      
                      {latestPeriod.valuations.ev_ebitda_valuation !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">EV/EBITDA-arvostus</h4>
                          <p className="text-lg">{formatCurrency(latestPeriod.valuations.ev_ebitda_valuation)}</p>
                          <p className="text-xs text-slate-500">
                            Laskukaava: (EBITDA × EV/EBITDA-kerroin) + kassa - korollinen velka
                          </p>
                        </div>
                      )}
                      
                      {latestPeriod.valuations.pe_valuation !== undefined && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500">P/E-arvostus</h4>
                          <p className="text-lg">{formatCurrency(latestPeriod.valuations.pe_valuation)}</p>
                          <p className="text-xs text-slate-500">
                            Laskukaava: Tilikauden tulos × P/E-kerroin
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-medium text-base mb-2">Arvostusmenetelmien selitykset</h3>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">EV/EBIT (Enterprise Value / Earnings Before Interest and Taxes):</span> 
                      <span className="text-slate-600"> Kuvaa yrityksen arvoa suhteessa liikevoittoon. Ottaa huomioon yrityksen velkaantuneisuuden.</span>
                    </li>
                    <li>
                      <span className="font-medium">EV/EBITDA (Enterprise Value / Earnings Before Interest, Taxes, Depreciation and Amortization):</span> 
                      <span className="text-slate-600"> Kuvaa yrityksen arvoa suhteessa käyttökatteeseen. Ei huomioi poistoja.</span>
                    </li>
                    <li>
                      <span className="font-medium">P/E (Price to Earnings):</span> 
                      <span className="text-slate-600"> Kuvaa osakkeen hintaa suhteessa osakekohtaiseen tulokseen. Käytetyin yksittäinen arvostuskerroin.</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default ValuationSummary;
