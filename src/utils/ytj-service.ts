
/**
 * Utility for fetching company data from the Finnish Business Information System (YTJ)
 */

// YTJ API v3 base URL
export const YTJ_API_BASE_URL = 'https://avoindata.prh.fi/opendata-ytj-api/v3';

export interface YTJCompanyData {
  business_id: string;
  name: string;
  industry_code: string;
  industry_name?: string;
  registration_date?: string;
  company_form?: string;
  street_address?: string;
  postal_code?: string;
  city?: string;
  website?: string;
}

/**
 * Fetches company data from YTJ API using business ID (Y-tunnus)
 * 
 * @param businessId Finnish business ID (Y-tunnus)
 * @returns Processed company data or throws an error
 */
export async function fetchYTJData(businessId: string): Promise<YTJCompanyData> {
  try {
    console.log('Fetching YTJ data for:', businessId);
    
    // Clean the business ID by removing spaces
    const formattedBusinessId = businessId.replace(/\s+/g, '');
    console.log('Formatted business ID:', formattedBusinessId);
    
    // Build the API URL for V3 API (using the companies endpoint with businessId parameter)
    const apiUrl = `${YTJ_API_BASE_URL}/companies?businessId=${formattedBusinessId}`;
    console.log('Making request to:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      console.error('YTJ API error with status:', response.status);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      
      // Try to parse the error response
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          throw new Error(`YTJ API virhe: ${errorJson.message}`);
        }
      } catch (parseError) {
        // If we can't parse JSON, just throw the general error
      }
      
      throw new Error(`YTJ API error: ${response.status} - Tarkista Y-tunnus ja yritä uudelleen.`);
    }
    
    const ytjResponse = await response.json();
    console.log('YTJ data received:', JSON.stringify(ytjResponse, null, 2));
    
    // v3 API returns a different format - check the companies array
    if (!ytjResponse || !ytjResponse.companies || ytjResponse.companies.length === 0) {
      throw new Error('Yritystietoja ei löytynyt.');
    }
    
    const companyData = ytjResponse.companies[0];
    
    // Extracting the company name from the names array (type "1" is the registered name typically)
    const mainName = companyData.names?.find(n => n.type === "1" && n.version === 1);
    const name = mainName?.name || "";
    
    console.log('Extracted company name:', name);
    
    // Extracting the business line (industry) code and name if available
    const mainBusinessLine = companyData.mainBusinessLine;
    const industryCode = mainBusinessLine?.type || "";
    const industryDescription = mainBusinessLine?.descriptions?.[0]?.description || "";
    
    // Extracting company form description
    const companyForm = companyData.companyForms?.[0]?.descriptions?.[0]?.description || "";
    
    // Address extraction - prioritize visiting address (type 1) over postal address (type 2)
    const visitingAddress = companyData.addresses?.find(a => a.type === 1);
    const postalAddress = companyData.addresses?.find(a => a.type === 2);
    const address = visitingAddress || postalAddress;
    
    // Extract website URL if available
    const websiteUrl = companyData.website?.url || "";
    
    // Map the v3 API response to our interface
    return {
      business_id: companyData.businessId?.value || "",
      name: name,
      industry_code: industryCode,
      industry_name: industryDescription,
      registration_date: companyData.registrationDate || "",
      company_form: companyForm,
      street_address: address?.street || "",
      postal_code: address?.postCode || "",
      city: address?.postOffices?.[0]?.city || "",
      website: websiteUrl,
    };
  } catch (error) {
    console.error('YTJ fetch error:', error);
    throw error;
  }
}

/**
 * Validates if a string is a proper Finnish business ID (Y-tunnus)
 * 
 * @param businessId Finnish business ID to validate
 * @returns True if the business ID is valid
 */
export function isValidBusinessId(businessId: string): boolean {
  // Remove any spaces or dashes
  const cleanBusinessId = businessId.replace(/\s+/g, '').replace(/-/g, '');
  
  // Finnish business ID is exactly 8 characters (7 digits + check character)
  if (cleanBusinessId.length !== 8) {
    return false;
  }
  
  // Check if first 7 characters are digits
  const digits = cleanBusinessId.slice(0, 7);
  if (!/^\d+$/.test(digits)) {
    return false;
  }
  
  // Validation algorithm for Finnish business ID
  const multipliers = [7, 9, 10, 5, 8, 4, 2];
  let sum = 0;
  
  for (let i = 0; i < 7; i++) {
    sum += parseInt(digits[i]) * multipliers[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? '0' : remainder === 1 ? '-' : (11 - remainder).toString();
  
  return checkDigit === cleanBusinessId[7];
}
