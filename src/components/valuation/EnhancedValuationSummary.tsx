import React, { useMemo } from "react";
import { 
  BarChart, 
  LineChart, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Calculator, 
  Clock,
  Info,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface EnhancedValuationSummaryProps {
  financialAnalysis: any; 
  companyInfo: any;
}

/**
 * Modernimpi tilinpäätösanalyysin esittäminen arvonmääritysraportissa
 */
const EnhancedValuationSummary: React.FC<EnhancedValuationSummaryProps> = ({ 
  financialAnalysis, 
  companyInfo 
}) => {
  // Extract the latest financial period safely
  const financialPeriods = financialAnalysis?.documents?.[0]?.financial_periods || [];
  const latestPeriod = useMemo(() => {
    if (financialPeriods.length === 0) return null;

    return financialPeriods.reduce((latest: any, current: any) => {
      const latestEndDate = latest?.period?.end_date ? new Date(latest.period.end_date) : null;
      const currentEndDate = current?.period?.end_date ? new Date(current.period.end_date) : null;
      if (!currentEndDate) return latest; // Skip if current has no date
      if (!latestEndDate) return current; // Take current if latest has no date
      return currentEndDate > latestEndDate ? current : latest;
    }, financialPeriods[0]);
  }, [financialPeriods]);

  // Format date in Finnish format
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Ei päiväystä";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fi-FI');
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Format currency with euro symbol, with appropriate color based on value
  const formatCurrency = (value: number | null | undefined, showColor: boolean = true): JSX.Element | null => {
    if (value === null || value === undefined || isNaN(value)) return null;

    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    };

    if (!Number.isInteger(value)) {
      options.minimumFractionDigits = 2;
      options.maximumFractionDigits = 2;
    }

    const formattedValue = new Intl.NumberFormat('fi-FI', options).format(value);

    if (!showColor) return <span>{formattedValue}</span>;

    if (value < 0) {
      return (
        <span className="flex items-center text-destructive font-medium">
          {formattedValue} 
          <ArrowDownRight className="ml-1 h-4 w-4" />
        </span>
      );
    } else if (value > 0) {
      return (
        <span className="flex items-center text-success font-medium">
          {formattedValue}
          <ArrowUpRight className="ml-1 h-4 w-4" />
        </span>
      );
    } else {
      return <span className="text-muted-foreground">{formattedValue}</span>;
    }
  };

  const formatPercentage = (value: number | null | undefined, showColor: boolean = true): JSX.Element | null => {
    if (value === null || value === undefined || isNaN(value)) return null;

    const formattedValue = `${value.toFixed(1)}%`;

    if (!showColor) return <span>{formattedValue}</span>;

    if (value < 0) {
      return (
        <span className="flex items-center text-destructive font-medium">
          {formattedValue} 
          <ArrowDownRight className="ml-1 h-4 w-4" />
        </span>
      );
    } else if (value > 0) {
      return (
        <span className="flex items-center text-success font-medium">
          {formattedValue}
          <ArrowUpRight className="ml-1 h-4 w-4" />
        </span>
      );
    } else {
      return <span className="text-muted-foreground">{formattedValue}</span>;
    }
  };

  // Extract relevant data from the latest period safely
  const incomeStatement = latestPeriod?.income_statement || {};
  const balanceSheet = latestPeriod?.balance_sheet || {};
  const dcfItems = latestPeriod?.dcf_items || {};
  const valuationMultiples = latestPeriod?.valuation_multiples || {};
  const valuationMetrics = latestPeriod?.valuation_metrics || {};
  const calculatedFields = latestPeriod?.calculated_fields || {};

  // Calculate some additional indicators
  const totalDebt = balanceSheet.liabilities_total || 0;
  const equityRatio = balanceSheet.assets_total ? 
    (balanceSheet.equity / balanceSheet.assets_total) * 100 : 0;
  const debtRatio = balanceSheet.assets_total ? 
    (totalDebt / balanceSheet.assets_total) * 100 : 0;
  const revenuePerEmployee = balanceSheet.personnel ? 
    (incomeStatement.revenue / balanceSheet.personnel) : 0;
  const profitMargin = incomeStatement.revenue ?
    (incomeStatement.net_income / incomeStatement.revenue) * 100 : 0;
  const ebitMargin = incomeStatement.revenue ?
    (incomeStatement.ebit / incomeStatement.revenue) * 100 : 0;
  const ebitdaMargin = incomeStatement.revenue && calculatedFields.ebitda_estimated ?
    (calculatedFields.ebitda_estimated / incomeStatement.revenue) * 100 : 0;

  // Check if we have enough data to show financial sections
  const hasFinancialData = latestPeriod && (
    Object.keys(incomeStatement).length > 0 || 
    Object.keys(balanceSheet).length > 0
  );

  if (!hasFinancialData) {
    return (
      <div className="p-4 border rounded-lg bg-destructive/10 border-destructive/20 shadow-neumorphic">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-destructive">Taloudelliset tiedot puuttuvat</h3>
            <p className="text-destructive text-sm mt-1">
              Taloudelliset tiedot puuttuvat tai ovat puutteellisia. 
              Täydellistä analyysiä varten tarvitaan tilinpäätöstiedot.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tilikausi */}
      {latestPeriod?.period?.start_date && latestPeriod?.period?.end_date && (
        <div className="border border-primary/20 rounded-lg bg-primary/10 p-4 flex items-center shadow-neumorphic">
          <Clock className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-primary">
              {financialPeriods.length > 1 ? "Viimeisin tilikausi" : "Tilikausi"}
            </h3>
            <p className="text-primary">{formatDate(latestPeriod.period.start_date)} – {formatDate(latestPeriod.period.end_date)}</p>
          </div>
        </div>
      )}

      {/* Tärkeimmät tunnusluvut */}
      <div className="border border-primary/20 rounded-xl overflow-hidden shadow-neumorphic">
        <div className="bg-primary p-4">
          <h2 className="text-lg font-bold text-primary-foreground flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Keskeiset taloudelliset tunnusluvut
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card">
          <div className="p-4 bg-muted rounded-lg border border-border shadow-neumorphic">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Liikevaihto</h3>
              <div className="p-1.5 rounded-full bg-primary/20">
                <LineChart className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(incomeStatement.revenue, false)}
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg border border-border shadow-neumorphic">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">EBITDA (Käyttökate)</h3>
              <div className="p-1.5 rounded-full bg-primary/20">
                <BarChart className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(calculatedFields.ebitda_estimated || incomeStatement.ebitda, true)}
            </div>
            {incomeStatement.revenue > 0 && (calculatedFields.ebitda_estimated || incomeStatement.ebitda) && (
              <div className="text-sm text-muted-foreground mt-1">
                {formatPercentage(ebitdaMargin)} liikevaihdosta
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg border border-border shadow-neumorphic">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">EBIT (Liikevoitto)</h3>
              <div className="p-1.5 rounded-full bg-primary/20">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(incomeStatement.ebit, true)}
            </div>
            {incomeStatement.revenue > 0 && incomeStatement.ebit && (
              <div className="text-sm text-muted-foreground mt-1">
                {formatPercentage(ebitMargin)} liikevaihdosta
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg border border-border shadow-neumorphic">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Nettotulos</h3>
              <div className="p-1.5 rounded-full bg-primary/20">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(incomeStatement.net_income, true)}
            </div>
            {incomeStatement.revenue > 0 && incomeStatement.net_income && (
              <div className="text-sm text-muted-foreground mt-1">
                {formatPercentage(profitMargin)} liikevaihdosta
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg border border-border shadow-neumorphic">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Oma pääoma</h3>
              <div className="p-1.5 rounded-full bg-primary/20">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-xl font-semibold">
              {formatCurrency(balanceSheet.equity, false)}
            </div>
            {balanceSheet.assets_total > 0 && balanceSheet.equity && (
              <div className="text-sm text-muted-foreground mt-1">
                {formatPercentage(equityRatio)} taseesta
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg border border-border shadow-neumorphic">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {valuationMetrics.calculated_net_debt < 0 ? "Nettovarat" : "Nettovelka"}
              </h3>
              <div className="p-1.5 rounded-full bg-primary/20">
                <Calculator className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="text-xl font-semibold">
              {valuationMetrics.calculated_net_debt < 0 
                ? formatCurrency(Math.abs(valuationMetrics.calculated_net_debt), false)
                : formatCurrency(valuationMetrics.calculated_net_debt, true)}
            </div>
            {valuationMetrics.calculated_net_debt < 0 && (
              <div className="text-sm text-primary mt-1">
                Kassavarat ylittävät korollisen velan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tuloslaskelma ja tase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tuloslaskelma */}
        <div className="border border-border rounded-xl overflow-hidden shadow-neumorphic">
          <div className="bg-muted p-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary" />
              Tuloslaskelma
            </h2>
          </div>

          <div className="p-4">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-2 text-muted-foreground">Liikevaihto</td>
                  <td className="py-2 text-right font-medium">
                    {formatCurrency(incomeStatement.revenue, false)}
                  </td>
                </tr>

                {incomeStatement.materials_and_services !== undefined && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Materiaalit ja palvelut</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.materials_and_services, true)}
                    </td>
                  </tr>
                )}

                {incomeStatement.personnel_expenses !== undefined && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Henkilöstökulut</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.personnel_expenses, true)}
                    </td>
                  </tr>
                )}

                {incomeStatement.other_expenses !== undefined && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Liiketoiminnan muut kulut</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.other_expenses, true)}
                    </td>
                  </tr>
                )}

                {(calculatedFields.ebitda_estimated || incomeStatement.ebitda) !== undefined && (
                  <tr className="border-b border-border bg-primary/10">
                    <td className="py-2 text-primary font-medium">EBITDA (Käyttökate)</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(calculatedFields.ebitda_estimated || incomeStatement.ebitda, true)}
                    </td>
                  </tr>
                )}

                {incomeStatement.depreciation !== undefined && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Poistot</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.depreciation, true)}
                    </td>
                  </tr>
                )}

                {incomeStatement.ebit !== undefined && (
                  <tr className="border-b border-border bg-primary/10">
                    <td className="py-2 text-primary font-medium">EBIT (Liikevoitto)</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.ebit, true)}
                    </td>
                  </tr>
                )}

                {incomeStatement.financial_income_expenses !== undefined && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Rahoitustuotot ja -kulut</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.financial_income_expenses, true)}
                    </td>
                  </tr>
                )}

                {incomeStatement.taxes !== undefined && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Verot</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.taxes, true)}
                    </td>
                  </tr>
                )}

                {incomeStatement.net_income !== undefined && (
                  <tr className="bg-primary/10">
                    <td className="py-2 text-primary font-medium">Tilikauden tulos</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(incomeStatement.net_income, true)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tase */}
        <div className="border border-border rounded-xl overflow-hidden shadow-neumorphic">
          <div className="bg-muted p-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-primary" />
              Tase
            </h2>
          </div>

          <div className="p-4">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-border bg-primary/10">
                  <td className="py-2 text-primary font-medium" colSpan={2}>Vastaavaa</td>
                </tr>

                {balanceSheet.intangible_assets !== undefined && balanceSheet.intangible_assets > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Aineettomat hyödykkeet</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.intangible_assets, false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.machinery_and_equipment !== undefined && balanceSheet.machinery_and_equipment > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Koneet ja kalusto</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.machinery_and_equipment, false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.real_estate !== undefined && balanceSheet.real_estate > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Kiinteistöt</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.real_estate, false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.inventory !== undefined && balanceSheet.inventory > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Vaihto-omaisuus</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.inventory, false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.accounts_receivable !== undefined && balanceSheet.accounts_receivable > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Myyntisaamiset</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.accounts_receivable, false)}
                    </td>
                  </tr>
                )}

                {dcfItems.cash !== undefined && dcfItems.cash > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Rahat ja pankkisaamiset</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(dcfItems.cash, false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.assets_total !== undefined && (
                  <tr className="border-b border-border bg-primary/10">
                    <td className="py-2 text-primary font-medium">Vastaavaa yhteensä</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.assets_total, false)}
                    </td>
                  </tr>
                )}

                <tr className="border-b border-border bg-primary/10 mt-2">
                  <td className="py-2 text-primary font-medium" colSpan={2}>Vastattavaa</td>
                </tr>

                {balanceSheet.equity !== undefined && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Oma pääoma</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.equity, false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.long_term_liabilities !== undefined && balanceSheet.long_term_liabilities > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Pitkäaikainen vieras pääoma</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.long_term_liabilities, false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.short_term_liabilities !== undefined && balanceSheet.short_term_liabilities > 0 && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Lyhytaikainen vieras pääoma</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(balanceSheet.short_term_liabilities, false)}
                    </td>
                  </tr>
                )}

                {(balanceSheet.long_term_liabilities !== undefined || balanceSheet.short_term_liabilities !== undefined) && (
                  <tr className="border-b border-border">
                    <td className="py-2 text-muted-foreground">Vieras pääoma yhteensä</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency((balanceSheet.long_term_liabilities || 0) + (balanceSheet.short_term_liabilities || 0), false)}
                    </td>
                  </tr>
                )}

                {balanceSheet.equity !== undefined && (
                  <tr className="bg-primary/10">
                    <td className="py-2 text-primary font-medium">Vastattavaa yhteensä</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency((balanceSheet.equity || 0) + (balanceSheet.long_term_liabilities || 0) + (balanceSheet.short_term_liabilities || 0), false)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      

      {/* Tehdyt normalisoinnit */}
      {financialAnalysis?.normalization_explanations?.applied_normalizations && 
       financialAnalysis.normalization_explanations.applied_normalizations.length > 0 && (
        <div className="border border-destructive/20 rounded-xl overflow-hidden shadow-neumorphic">
          <div className="bg-destructive/10 p-4 border-b border-destructive/20">
            <h2 className="font-bold text-destructive flex items-center">
              <Info className="h-5 w-5 mr-2 text-destructive" />
              Tilinpäätöksen normalisoinnit
            </h2>
            <p className="text-sm text-destructive mt-1">
              {financialAnalysis.normalization_explanations.summary || 
               "Tilinpäätöslukuja on normalisoitu seuraavilla korjauksilla:"}
            </p>
          </div>

          <div className="p-4 bg-card">
            <ul className="space-y-3">
              {financialAnalysis.normalization_explanations.applied_normalizations.map((norm: any, idx: number) => {
                const fieldName = norm.field.split('.').pop();
                const fieldLabel = 
                  fieldName === 'other_income' ? 'Liiketoiminnan muut tuotot' :
                  fieldName === 'other_expenses' ? 'Liiketoiminnan muut kulut' :
                  fieldName === 'personnel_expenses' ? 'Henkilöstökulut' :
                  fieldName;

                return (
                  <li key={idx} className="flex items-start bg-destructive/10 p-3 rounded-lg border border-destructive/10">
                    <div className="bg-destructive/20 text-destructive rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 mr-3">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-destructive">{fieldLabel}</h4>
                      <p className="text-destructive text-sm">{norm.explanation}</p>
                      {norm.original_value !== undefined && norm.normalized_value !== undefined && (
                        <p className="text-destructive text-sm mt-1">
                          <span className="line-through">{formatCurrency(norm.original_value, false)}</span>
                          {" → "}
                          <span className="font-medium">{formatCurrency(norm.normalized_value, false)}</span>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Tunnuslukujen selitykset */}
      <div className="border border-border rounded-xl overflow-hidden shadow-neumorphic">
        <div className="bg-muted p-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center">
            <Info className="h-5 w-5 mr-2 text-primary" />
            Tunnuslukujen selitykset
          </h2>
        </div>

        <div className="p-4 bg-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
              <h3 className="font-medium text-foreground">EBITDA (Käyttökate)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tulos ennen korkoja, veroja, poistoja ja arvonalentumisia. 
                Kuvaa yrityksen operatiivista kannattavuutta ennen investointeja.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
              <h3 className="font-medium text-foreground">EBIT (Liikevoitto)</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tulos ennen korkoja ja veroja. Kertoo liiketoiminnan operatiivisen
                tuloksen ennen rahoituseriä.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
              <h3 className="font-medium text-foreground">Nettovelka</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Korollinen velka vähennettynä rahavaroilla. Kuvaa yrityksen todellista 
                velkarasitusta.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg shadow-neumorphic">
              <h3 className="font-medium text-foreground">Omavaraisuusaste</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Oman pääoman suhde taseen loppusummaan. Kuvaa yrityksen vakavaraisuutta
                ja tappionsietokykyä.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for displaying tooltips
const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <div className="flex items-start">
      <Info className="h-4 w-4 text-muted-foreground/40 mr-1 flex-shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
};

export default EnhancedValuationSummary;