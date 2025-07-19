// YTJ Open Data API integration
// Docs: https://avoindata.prh.fi/ytj_en.html

interface YTJCompany {
  businessId: string;
  name: string;
  registrationDate: string;
  companyForm: string;
  businessLine?: string;
  businessLineCode?: string;
  addresses?: Array<{
    street?: string;
    postCode?: string;
    city?: string;
    type?: number; // 1 = postal, 2 = visiting
  }>;
}

export async function fetchYTJData(searchTerm: string): Promise<YTJCompany | null> {
  try {
    // Check if it's a business ID
    const isBusinessId = /^\d{7}-\d$/.test(searchTerm);
    
    let apiUrl: string;
    if (isBusinessId) {
      // Direct business ID lookup
      apiUrl = `https://avoindata.prh.fi/opendata/bis/v1/businessId/${searchTerm}`;
    } else {
      // Search by name
      apiUrl = `https://avoindata.prh.fi/opendata/bis/v1?name=${encodeURIComponent(searchTerm)}&maxResults=10`;
    }

    console.log(`Fetching YTJ data from: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`YTJ API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Handle search results vs direct lookup
    let company;
    if (isBusinessId) {
      // Direct lookup returns single result
      company = data.results?.[0];
    } else {
      // Search returns array, find best match
      company = data.results?.find((c: any) => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || data.results?.[0];
    }

    if (!company) {
      return null;
    }

    // Extract business line (toimiala)
    const businessLineObj = company.businessLines?.find((bl: any) => 
      bl.order === 0 // Primary business line
    );

    // Extract addresses
    const addresses = company.addresses?.map((addr: any) => ({
      street: addr.street,
      postCode: addr.postCode,
      city: addr.city,
      type: addr.type
    }));

    return {
      businessId: company.businessId,
      name: company.name,
      registrationDate: company.registrationDate,
      companyForm: company.companyForm || "OY",
      businessLine: businessLineObj?.name,
      businessLineCode: businessLineObj?.code,
      addresses
    };

  } catch (error) {
    console.error('YTJ fetch error:', error);
    return null;
  }
}