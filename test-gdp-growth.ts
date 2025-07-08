// Test Eurostat GDP Growth API

async function testEurostatGDPGrowth() {
  console.log('Testing Eurostat GDP Growth API...\n');
  
  // Test 1: Finland GDP growth 2024
  try {
    const url1 = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tec00115?format=JSON&geo=FI&time=2024';
    console.log('Fetching Finland GDP growth 2024...');
    const response1 = await fetch(url1);
    const data1 = await response1.json();
    console.log('Finland 2024:', JSON.stringify(data1, null, 2).substring(0, 500) + '...\n');
  } catch (error) {
    console.error('Error fetching Finland data:', error);
  }
  
  // Test 2: EU27 GDP growth 2024
  try {
    const url2 = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tec00115?format=JSON&geo=EU27_2020&time=2024';
    console.log('Fetching EU27 GDP growth 2024...');
    const response2 = await fetch(url2);
    const data2 = await response2.json();
    console.log('EU27 2024:', JSON.stringify(data2, null, 2).substring(0, 500) + '...\n');
  } catch (error) {
    console.error('Error fetching EU27 data:', error);
  }
  
  // Test 3: Finland multi-year data
  try {
    const url3 = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tec00115?format=JSON&geo=FI&time=2020&time=2021&time=2022&time=2023&time=2024';
    console.log('Fetching Finland GDP growth 2020-2024...');
    const response3 = await fetch(url3);
    const data3 = await response3.json();
    
    // Parse the data structure
    if (data3.value) {
      console.log('GDP Growth values:', data3.value);
      console.log('Time periods:', Object.keys(data3.dimension.time.category.index));
    }
  } catch (error) {
    console.error('Error fetching multi-year data:', error);
  }
}

// Function to add to real-financial-data.ts
async function fetchEurostatGDPGrowth(): Promise<{ value: number; source: string; timestamp: string; success: boolean; confidence: 'high' | 'medium' | 'low' }> {
  const url = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tec00115';
  const params = {
    format: 'JSON',
    geo: 'EU27_2020', // EU27 average
    time: '2024'      // Latest year
  };

  try {
    console.log('Fetching REAL Eurostat GDP growth data...');
    
    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Parse Eurostat JSON structure
    const gdpGrowth = data.value?.[0] || 0; // GDP growth percentage
    
    console.log(`Eurostat GDP growth: ${gdpGrowth}%`);
    
    return {
      value: gdpGrowth / 100, // Convert percentage to decimal
      source: 'Eurostat_tec00115_live',
      timestamp: new Date().toISOString(),
      success: true,
      confidence: 'high'
    };
    
  } catch (error) {
    console.error('Eurostat GDP growth fetch failed:', error);
    
    // Fallback to reasonable default
    return {
      value: 0.015, // 1.5% default GDP growth
      source: 'default_estimate',
      timestamp: new Date().toISOString(),
      success: false,
      confidence: 'low'
    };
  }
}

// Run the test
testEurostatGDPGrowth();