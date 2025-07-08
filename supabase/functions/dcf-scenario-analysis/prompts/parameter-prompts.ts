export const PARAMETER_PROMPTS = {
  FULL_DCF: `Analyze the company's historical financials and industry benchmarks to suggest DCF parameters.

DO NOT CALCULATE - only analyze and suggest parameter values.

Based on the data provided, determine:

1. Revenue Growth Rates (next 5 years):
   - Analyze historical growth trends
   - Consider industry growth rates
   - Factor in company's competitive position
   - Suggest realistic year-by-year rates

2. Operating Margins:
   - Review historical EBITDA/EBIT margins
   - Compare to industry peers
   - Consider economies of scale
   - Suggest margin progression

3. Capital Expenditure:
   - Historical CapEx as % of revenue
   - Industry standards
   - Growth phase considerations
   - Suggest CapEx percentage

4. Working Capital:
   - Historical NWC as % of revenue
   - Industry norms
   - Efficiency improvements
   - Suggest NWC percentage

5. Terminal Growth Rate:
   - Long-term GDP growth
   - Industry maturity
   - Competitive dynamics
   - Suggest sustainable rate (typically 2-4%)

6. Tax Rate:
   - Effective tax rate history
   - Statutory rates
   - Tax planning considerations

OUTPUT FORMAT:
{
  "revenueGrowthRates": [0.15, 0.12, 0.10, 0.08, 0.06],
  "operatingMargin": 0.25,
  "capexPercentage": 0.05,
  "nwcPercentage": 0.10,
  "terminalGrowthRate": 0.03,
  "taxRate": 0.25,
  "rationale": "Brief explanation of key assumptions"
}`,

  SIMPLIFIED_DCF: `Analyze the company data to suggest simplified DCF parameters.

DO NOT CALCULATE - only suggest parameter values based on analysis.

Determine these key inputs:

1. Base Revenue Growth Rate:
   - Recent growth trends
   - Market conditions
   - Competitive position
   - Single rate for projection period

2. EBITDA Margin:
   - Historical EBITDA margins
   - Peer comparisons
   - Operational efficiency trends
   - Target margin level

3. Terminal Growth Rate:
   - GDP growth expectations
   - Industry maturity
   - Must be reasonable (2-3% typically)

4. Basic Assumptions:
   - Tax rate from financials
   - Depreciation as % of revenue
   - Simple CapEx assumption

Consider:
- Company size and maturity
- Industry characteristics
- Economic environment
- Competitive advantages

OUTPUT FORMAT:
{
  "revenueGrowthRate": 0.10,
  "ebitdaMargin": 0.20,
  "terminalGrowthRate": 0.025,
  "taxRate": 0.25,
  "depreciationRate": 0.03,
  "capexRate": 0.04,
  "rationale": "Key drivers of assumptions"
}`,

  FORWARD_MULTIPLE: `Analyze the company and industry to suggest forward multiple parameters.

DO NOT CALCULATE - only analyze and suggest appropriate multiples.

Based on the data, determine:

1. Revenue Growth Projection:
   - Next 12 months growth rate
   - Based on recent performance
   - Market conditions
   - Company guidance if available

2. Appropriate EV/Revenue Multiple:
   - Industry peer multiples
   - Growth rate premium/discount
   - Profitability considerations
   - Market conditions

3. Appropriate EV/EBITDA Multiple:
   - Peer group multiples
   - Quality factors
   - Growth profile
   - Margin stability

4. Multiple Adjustments:
   - Size premium/discount
   - Market position
   - Financial health
   - Growth differential

Consider these factors:
- Industry typical multiples
- Company's relative position
- Growth vs peers
- Profitability vs peers
- Risk profile

OUTPUT FORMAT:
{
  "forwardRevenueGrowth": 0.12,
  "evRevenueMultiple": 3.5,
  "evEbitdaMultiple": 12.0,
  "peerMedianEvRevenue": 3.0,
  "peerMedianEvEbitda": 10.5,
  "multipleAdjustmentRationale": "Premium due to higher growth",
  "keyComparisons": "Growth 2x peer average, margins in line"
}`,

  SCENARIO_ANALYSIS: `Based on the company analysis, suggest scenario parameters.

DO NOT CALCULATE - only suggest different scenario assumptions.

Create three scenarios:

BASE CASE:
- Most likely outcome
- Current trends continue
- Moderate assumptions

BULL CASE:
- Optimistic but realistic
- Market share gains
- Margin expansion
- ~20-30% more aggressive than base

BEAR CASE:
- Conservative scenario
- Competitive pressures
- Margin compression
- ~20-30% more conservative than base

For each scenario, vary:
- Growth rates
- Margins
- Terminal values
- Risk factors

OUTPUT FORMAT:
{
  "base": {
    "growthRate": 0.10,
    "margin": 0.20,
    "terminalGrowth": 0.03
  },
  "bull": {
    "growthRate": 0.15,
    "margin": 0.25,
    "terminalGrowth": 0.035
  },
  "bear": {
    "growthRate": 0.05,
    "margin": 0.15,
    "terminalGrowth": 0.02
  },
  "keyDrivers": "Main factors affecting scenarios"
}`
};

export const PARAMETER_EXTRACTION_PROMPT = `Extract and validate the suggested parameters from the analysis.

Ensure all values are:
- Reasonable and justified
- Internally consistent
- Based on data provided
- Within normal ranges

DO NOT perform any calculations or valuations.
ONLY extract and format the suggested parameters.

Required checks:
- Growth rates: Typically 0-30% for mature companies
- Margins: Must be realistic for the industry
- Terminal growth: Usually 2-4%, never above GDP
- Multiples: Within reasonable peer ranges
- Tax rates: Between 15-35% typically

If any parameter seems unreasonable, adjust to a more conservative estimate.`;