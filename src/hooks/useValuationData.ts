import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BaseValues, Multipliers, ValuationData } from '@/types/simulator';

interface UseValuationDataResult {
  latestValuation: ValuationData | null;
  baseValues: BaseValues;
  originalMultipliers: Multipliers;
  isLoading: boolean;
  error: string | null;
}

export const useValuationData = (companyId?: string): UseValuationDataResult => {
  const navigate = useNavigate();
  const [latestValuation, setLatestValuation] = useState<ValuationData | null>(null);
  const [baseValues, setBaseValues] = useState<BaseValues>({
    revenue: 0,
    ebit: 0,
    ebitda: 0,
    equity: 0,
    netDebt: 0,
    depreciation: 0,
    currentValue: 0
  });
  const [originalMultipliers, setOriginalMultipliers] = useState<Multipliers>({
    revenue: 1.0,
    ebit: 6.0,
    ebitda: 5.0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extractFinancialData = (data: any) => {
    console.log('Full valuation data:', data);
    console.log('Results path:', data.results);
    console.log('Financial analysis:', data.results?.financialAnalysis);

    let latestPeriod = null;

    // Try multiple paths to find the financial data, prioritizing sorted periods or latest data
    if (data.results?.financialAnalysis?.documents?.[0]?.sortedPeriods?.[0]) {
      // Use sorted periods (latest first)
      latestPeriod = data.results.financialAnalysis.documents[0].sortedPeriods[0];
      console.log('Found data via sortedPeriods path (latest period)');
    } else if (data.results?.financialAnalysis?.documents?.[0]?.financial_periods?.length > 0) {
      // Standard path - find latest period by date
      const periods = data.results.financialAnalysis.documents[0].financial_periods;
      latestPeriod = periods.reduce((latest: any, current: any) => {
        const latestDate = new Date(latest.period?.end_date || '1900-01-01');
        const currentDate = new Date(current.period?.end_date || '1900-01-01');
        return currentDate > latestDate ? current : latest;
      });
      console.log('Found data via financial_periods path (latest by date)');
    } else if (data.results?.financialAnalysis?.financial_periods?.length > 0) {
      // Alternative path - find latest period by date
      const periods = data.results.financialAnalysis.financial_periods;
      latestPeriod = periods.reduce((latest: any, current: any) => {
        const latestDate = new Date(latest.period?.end_date || '1900-01-01');
        const currentDate = new Date(current.period?.end_date || '1900-01-01');
        return currentDate > latestDate ? current : latest;
      });
      console.log('Found data via alternative financial_periods path (latest by date)');
    } else if (data.results?.financialAnalysis?.latest_period) {
      // Another alternative path
      latestPeriod = data.results.financialAnalysis.latest_period;
      console.log('Found data via latest_period path');
    } else if (data.results?.financialAnalysis) {
      // Try to find any financial_periods in the structure
      console.log('Searching for financial periods in structure...');
      const findFinancialPeriods = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.financial_periods && Array.isArray(obj.financial_periods)) {
          return obj.financial_periods[0];
        }
        for (const key in obj) {
          const result = findFinancialPeriods(obj[key]);
          if (result) return result;
        }
        return null;
      };
      latestPeriod = findFinancialPeriods(data.results.financialAnalysis);
    }

    console.log('Latest period found:', latestPeriod);

    if (!latestPeriod) {
      throw new Error('Arvonmäärityksen tiedoissa ei löydy taloudellisia lukuja');
    }

    // Extract values with comprehensive fallbacks
    const getRevenue = () => {
      return latestPeriod?.weighted_financials?.revenue || 
             latestPeriod?.income_statement?.revenue || 
             latestPeriod?.revenue ||
             0;
    };

    const getEbit = () => {
      return latestPeriod?.weighted_financials?.ebit || 
             latestPeriod?.income_statement?.ebit || 
             latestPeriod?.ebit ||
             0;
    };

    const getEbitda = () => {
      // Try multiple sources for EBITDA
      if (latestPeriod?.weighted_financials?.ebitda) {
        return latestPeriod.weighted_financials.ebitda;
      }
      if (latestPeriod?.income_statement?.ebitda) {
        return latestPeriod.income_statement.ebitda;
      }
      if (latestPeriod?.calculated_fields?.ebitda_estimated) {
        return latestPeriod.calculated_fields.ebitda_estimated;
      }
      if (latestPeriod?.calculated_fields?.ebitda) {
        return latestPeriod.calculated_fields.ebitda;
      }
      if (latestPeriod?.ebitda) {
        return latestPeriod.ebitda;
      }

      // Calculate EBITDA from EBIT + depreciation if available
      const ebit = getEbit();
      const depreciation = Math.abs(
        latestPeriod?.income_statement?.depreciation || 
        latestPeriod?.depreciation || 
        0
      );

      if (ebit !== 0 && depreciation !== 0) {
        console.log(`Calculating EBITDA: ${ebit} + ${depreciation} = ${ebit + depreciation}`);
        return ebit + depreciation;
      }

      // If we have EBIT but no depreciation, estimate EBITDA as EBIT * 1.2
      if (ebit !== 0) {
        console.log(`Estimating EBITDA from EBIT: ${ebit} * 1.2 = ${ebit * 1.2}`);
        return ebit * 1.2;
      }

      return 0;
    };

    const getEquity = () => {
      return latestPeriod?.balance_sheet?.equity || 
             latestPeriod?.equity ||
             0;
    };

    const getNetDebt = () => {
      if (latestPeriod?.valuation_metrics?.calculated_net_debt !== undefined) {
        return latestPeriod.valuation_metrics.calculated_net_debt;
      }

      const debt = latestPeriod?.dcf_items?.interest_bearing_debt || 
                  latestPeriod?.balance_sheet?.interest_bearing_debt ||
                  latestPeriod?.debt || 
                  0;
      const cash = latestPeriod?.dcf_items?.cash || 
                  latestPeriod?.balance_sheet?.cash ||
                  latestPeriod?.cash || 
                  0;

      return debt - cash;
    };

    const getCurrentValue = () => {
      return latestPeriod?.valuation_metrics?.average_equity_valuation ||
             latestPeriod?.valuation_metrics?.equity_valuation ||
             latestPeriod?.average_equity_valuation ||
             data.results?.valuationReport?.average_equity_valuation ||
             0;
    };

    const baseVals: BaseValues = {
      revenue: getRevenue(),
      ebit: getEbit(),
      ebitda: getEbitda(),
      equity: getEquity(),
      netDebt: getNetDebt(),
      depreciation: Math.abs(latestPeriod?.income_statement?.depreciation || 0),
      currentValue: getCurrentValue()
    };

    console.log('Extracted base values:', baseVals);
    console.log('Data sources:', {
      weightedFinancials: latestPeriod?.weighted_financials,
      incomeStatement: latestPeriod?.income_statement,
      calculatedFields: latestPeriod?.calculated_fields,
      valuationMetrics: latestPeriod?.valuation_metrics
    });

    // Validate that we have at least some data
    if (baseVals.revenue === 0 && baseVals.ebit === 0 && baseVals.equity === 0) {
      throw new Error('Taloudellisten lukujen lukeminen epäonnistui');
    }

    // Set initial multipliers from valuation with fallbacks
    const mults: Multipliers = {
      revenue: latestPeriod?.valuation_multiples?.revenue_multiple?.multiple || 
               latestPeriod?.valuation_metrics?.ev_revenue || 
               1.0,
      ebit: latestPeriod?.valuation_multiples?.ev_ebit?.multiple || 
            latestPeriod?.valuation_metrics?.ev_ebit || 
            6.0,
      ebitda: latestPeriod?.valuation_multiples?.ev_ebitda?.multiple || 
              latestPeriod?.valuation_metrics?.ev_ebitda || 
              5.0
    };

    return { baseVals, mults };
  };

  useEffect(() => {
    const loadValuation = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const { data, error } = await supabase
          .from('valuations')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) {
          console.log('No valuation found, redirecting...');
          navigate('/valuation');
          return;
        }

        setLatestValuation(data);
        
        const { baseVals, mults } = extractFinancialData(data);
        setBaseValues(baseVals);
        setOriginalMultipliers(mults);

      } catch (error) {
        console.error('Error loading valuation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Arvonmäärityksen lataaminen epäonnistui';
        setError(errorMessage);
        toast({
          title: "Virhe",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadValuation();
  }, [companyId, navigate]);

  return {
    latestValuation,
    baseValues,
    originalMultipliers,
    isLoading,
    error
  };
};