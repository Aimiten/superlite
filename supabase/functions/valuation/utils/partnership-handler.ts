// Function for handling partnership-specific data and validation

// Helper function to calculate weighted value across multiple periods
function calculateWeightedValue(data, weightingFunction) {
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const item of data) {
    const value = parseFloat(item.value);
    const weight = weightingFunction(item);
    
    if (!isNaN(value) && !isNaN(weight)) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Completes and validates data for partnerships based on user inputs
 */
export async function completePartnershipData(companyName, financialAnalysis, partnershipInputs) {
  console.log(`Processing partnership data for ${companyName}`);
  
  if (!financialAnalysis || !financialAnalysis.documents) {
    console.error("No valid financial analysis data to enhance");
    return {
      error: "Puutteelliset taloudelliset tiedot"
    };
  }
  
  // Clone the data to avoid directly modifying the input
  const jsonData = JSON.parse(JSON.stringify(financialAnalysis));
  
  try {
    // Process partnership specific data
    const document = jsonData.documents[0];
    const period = document?.financial_periods?.[0];
    
    if (!period) {
      throw new Error("Tilikauden tiedot puuttuvat");
    }
    
    // Validate required inputs exist
    if (!partnershipInputs || typeof partnershipInputs !== 'object') {
      throw new Error("Virheelliset lähtötiedot");
    }
    
    console.log("Processing partnership inputs:", partnershipInputs);
    
    // Process period overrides if they exist in the partnership inputs
    if (partnershipInputs.period_overrides) {
      const overrides = partnershipInputs.period_overrides;
      
      // Validate the structure of period_overrides
      if (typeof overrides !== 'object') {
        throw new Error("Virheellinen period_overrides muoto");
      }
      
      // Process revenue override
      if (overrides.revenue) {
        const revenueValue = parseFloat(overrides.revenue);
        if (!isNaN(revenueValue)) {
          period.income_statement.revenue = revenueValue;
          console.log(`Revenue overridden with value: ${revenueValue}`);
        } else {
          console.warn("Invalid revenue value provided, ignoring override");
        }
      }
      
      // Process ebit override
      if (overrides.ebit) {
        const ebitValue = parseFloat(overrides.ebit);
        if (!isNaN(ebitValue)) {
          period.income_statement.ebit = ebitValue;
          console.log(`EBIT overridden with value: ${ebitValue}`);
        } else {
          console.warn("Invalid EBIT value provided, ignoring override");
        }
      }
    }
    
    // Initialize the entrepreneur info object if it doesn't exist
    if (!period.entrepreneur_info) {
      period.entrepreneur_info = {};
    }
    
    // Process entrepreneur salary data
    if (partnershipInputs.entrepreneur_salary) {
      if (!Array.isArray(partnershipInputs.entrepreneur_salary)) {
        throw new Error("Yrittäjäpalkkojen muoto on virheellinen");
      }
      
      // Calculate weighted average of entrepreneur salary
      period.entrepreneur_info.salary = calculateWeightedValue(
        partnershipInputs.entrepreneur_salary,
        item => parseFloat(item.weight)
      );
      
      console.log(`Calculated entrepreneur salary: ${period.entrepreneur_info.salary}`);
    }
    
    // Process other entrepreneur benefits
    if (partnershipInputs.entrepreneur_benefits) {
      if (!Array.isArray(partnershipInputs.entrepreneur_benefits)) {
        throw new Error("Muitten yrittäjäetujen muoto on virheellinen");
      }
      
      // Calculate weighted average of entrepreneur benefits
      period.entrepreneur_info.benefits = calculateWeightedValue(
        partnershipInputs.entrepreneur_benefits,
        item => parseFloat(item.weight)
      );
      
      console.log(`Calculated entrepreneur benefits: ${period.entrepreneur_info.benefits}`);
    }
    
    // Process missing data
    if (partnershipInputs.additional_answers && Array.isArray(partnershipInputs.additional_answers)) {
      // Validate the structure of additional_answers
      for (const answer of partnershipInputs.additional_answers) {
        if (typeof answer !== 'object' || !answer.id || !answer.category || !answer.value) {
          throw new Error("Virheellinen additional_answers muoto");
        }
      }
      
      // Format answers for the API call
      const formattedAnswers = partnershipInputs.additional_answers.map(answer => ({
        id: answer.id,
        category: answer.category,
        answer: answer.value
      }));
      
      console.log("Formatted answers:", JSON.stringify(formattedAnswers));
      
      // Import the function from the main financial-analysis.ts
      const { analyzeFinancialPDFWithAnswers } = await import('../financial-analysis.ts');
      
      // Call the second phase of the analysis
      const secondPhaseData = await analyzeFinancialPDFWithAnswers(
        companyName,
        partnershipInputs.fileBase64,
        formattedAnswers,
        partnershipInputs.fileMimeType,
        partnershipInputs.companyType
      );
      
      // Merge the second phase data with our existing data
      Object.assign(jsonData.documents[0].financial_periods[0], secondPhaseData.documents[0].financial_periods[0]);
      
      console.log("Second phase analysis completed");
      
      // Calculate financial metrics based on the normalized data
      const { calculateFinancialMetrics } = await import('../financial-analysis.ts');
      const updatedData = calculateFinancialMetrics(secondPhaseData, {});
      
      return updatedData;
    }
    
    // Validate the data is complete after processing all inputs
    if (!validatePartnershipData(period)) {
      console.warn("Data validation failed, indicating missing fields");
      return {
        ...jsonData,
        validation: {
          missing_data: getMissingFields(period)
        }
      };
    }
    
    // Calculate the final analysis with the processed data
    return await finalizePartnershipAnalysis(jsonData);
  } catch (error) {
    console.error("Error processing partnership data:", error);
    return {
      error: error.message || "Virhe toiminimen tai henkilöyhtiön tietojen käsittelyssä"
    };
  }
}

/**
 * Validates that all required fields for partnership valuation exist
 */
function validatePartnershipData(period) {
  const requiredFields = [
    "income_statement.revenue",
    "income_statement.ebit",
    "balance_sheet.total_assets",
    "balance_sheet.total_liabilities",
    "entrepreneur_info.salary",
    "entrepreneur_info.benefits"
  ];
  
  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj && obj[key], period);
    if (value === undefined || value === null) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Finalizes the partnership analysis with Gemini validation and metric calculations
 */
async function finalizePartnershipAnalysis(jsonData) {
  try {
    // Validate the structure of jsonData
    if (!jsonData || !jsonData.documents || !Array.isArray(jsonData.documents)) {
      throw new Error("Virheellinen analyysitulos");
    }
    
    // Calculate financial metrics for the updated data
    // Import from the main financial-analysis.ts file
    const { calculateFinancialMetrics } = await import('../financial-analysis.ts');
    const updatedData = calculateFinancialMetrics(jsonData, {});
    
    return updatedData;
  } catch (error) {
    console.error("Error finalizing partnership analysis:", error);
    return {
      error: error.message || "Virhe lopullisen analyysin muodostamisessa"
    };
  }
}

// Helper function to get the list of missing fields
function getMissingFields(period) {
  const requiredFields = [
    "income_statement.revenue",
    "income_statement.ebit",
    "balance_sheet.total_assets",
    "balance_sheet.total_liabilities",
    "entrepreneur_info.salary",
    "entrepreneur_info.benefits"
  ];
  
  const missingFields = [];
  
  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj && obj[key], period);
    if (value === undefined || value === null) {
      missingFields.push(field);
    }
  }
  
  return missingFields;
}
