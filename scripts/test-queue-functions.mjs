#!/usr/bin/env node

// Test script for queue functions using Fetch API
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rmkleyyzieacwltcbgzs.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Please set VITE_SUPABASE_ANON_KEY environment variable');
  console.log('Example: VITE_SUPABASE_ANON_KEY=your-key node test-queue-functions.mjs');
  process.exit(1);
}

// Helper function to call edge function
async function callEdgeFunction(functionName, payload) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      data: response.ok ? data : null,
      error: !response.ok ? data : null,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
}

// Test cases
const testCases = [
  {
    name: 'Valid sales readiness analysis request',
    function: 'analyze-sales-readiness',
    payload: {
      companyId: 'test-company-123',
      valuationId: 'test-valuation-456'
    }
  },
  {
    name: 'Sales readiness without valuationId',
    function: 'analyze-sales-readiness',
    payload: {
      companyId: 'test-company-789'
    }
  },
  {
    name: 'Sales readiness with missing companyId',
    function: 'analyze-sales-readiness',
    payload: {
      valuationId: 'test-valuation-999'
    }
  },
  {
    name: 'Valid post-DD analysis request',
    function: 'analyze-post-dd-readiness',
    payload: {
      companyId: 'test-company-123',
      valuationId: 'test-valuation-456',
      previousAnalysisId: 'test-analysis-789'
    }
  },
  {
    name: 'Post-DD without previousAnalysisId',
    function: 'analyze-post-dd-readiness',
    payload: {
      companyId: 'test-company-123',
      valuationId: 'test-valuation-456'
    }
  },
  {
    name: 'Post-DD with empty payload',
    function: 'analyze-post-dd-readiness',
    payload: {}
  },
  {
    name: 'Test with non-existent company',
    function: 'analyze-sales-readiness',
    payload: {
      companyId: '00000000-0000-0000-0000-000000000000',
      valuationId: '00000000-0000-0000-0000-000000000001'
    }
  }
];

// Run tests
async function runTests() {
  console.log('🧪 Starting queue function tests...\n');
  console.log('🔌 Using Supabase URL:', SUPABASE_URL);
  console.log('🔑 Using API Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');
  
  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`   Function: ${testCase.function}`);
    console.log(`   Payload:`, JSON.stringify(testCase.payload, null, 2));
    
    try {
      const result = await callEdgeFunction(testCase.function, testCase.payload);
      
      if (result.success) {
        console.log(`   ✅ Success (${result.status}):`, JSON.stringify(result.data, null, 2));
      } else {
        console.log(`   ❌ Error (${result.status}):`, JSON.stringify(result.error, null, 2));
      }
    } catch (error) {
      console.log(`   💥 Exception:`, error.message);
    }
    
    console.log('');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test duplicate handling - call same request twice
  console.log('📋 Test: Duplicate request handling');
  console.log('   Calling same request twice in quick succession...');
  
  const duplicatePayload = {
    companyId: 'test-company-duplicate-2',
    valuationId: 'test-valuation-duplicate-2'
  };
  
  try {
    const [result1, result2] = await Promise.all([
      callEdgeFunction('analyze-sales-readiness', duplicatePayload),
      callEdgeFunction('analyze-sales-readiness', duplicatePayload)
    ]);
    
    console.log('   First call:', result1.success ? '✅ Success' : '❌ Error', `(${result1.status})`);
    console.log('   Second call:', result2.success ? '✅ Success' : '❌ Error', `(${result2.status})`);
    console.log('   First response:', JSON.stringify(result1.data || result1.error, null, 2));
    console.log('   Second response:', JSON.stringify(result2.data || result2.error, null, 2));
  } catch (error) {
    console.log(`   💥 Exception:`, error.message);
  }
  
  console.log('\n🏁 Tests completed');
}

// Run the tests
runTests();