#!/usr/bin/env node

// Heavy test script for queue functions
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rmkleyyzieacwltcbgzs.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Please set VITE_SUPABASE_ANON_KEY environment variable');
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

// Generate test data
function generateTestData(index) {
  return {
    companyId: `company-${Date.now()}-${index}`,
    valuationId: `valuation-${Date.now()}-${index}`,
    previousAnalysisId: index % 3 === 0 ? `analysis-${Date.now()}-${index}` : undefined
  };
}

// Heavy test cases
async function runHeavyTests() {
  console.log('🔥 Starting HEAVY queue function tests...\n');
  console.log('🔌 Using Supabase URL:', SUPABASE_URL);
  console.log('🔑 Using API Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

  // Test 1: Burst of requests
  console.log('📋 Test 1: Burst of 20 simultaneous requests');
  const burstPromises = [];
  for (let i = 0; i < 20; i++) {
    const payload = generateTestData(i);
    burstPromises.push(
      callEdgeFunction('analyze-sales-readiness', payload)
    );
  }
  
  const burstResults = await Promise.all(burstPromises);
  const burstSuccess = burstResults.filter(r => r.success).length;
  const burstFailed = burstResults.filter(r => !r.success).length;
  console.log(`   ✅ Success: ${burstSuccess}, ❌ Failed: ${burstFailed}`);
  console.log(`   Queue IDs: ${burstResults.filter(r => r.success).map(r => r.data.queueMessageId).join(', ')}\n`);

  // Test 2: Mixed function calls
  console.log('📋 Test 2: Mixed sales-readiness and post-DD requests (30 total)');
  const mixedPromises = [];
  for (let i = 0; i < 30; i++) {
    const payload = generateTestData(i);
    const functionName = i % 2 === 0 ? 'analyze-sales-readiness' : 'analyze-post-dd-readiness';
    mixedPromises.push(
      callEdgeFunction(functionName, payload)
    );
  }
  
  const mixedResults = await Promise.all(mixedPromises);
  const mixedSuccess = mixedResults.filter(r => r.success).length;
  const mixedFailed = mixedResults.filter(r => !r.success).length;
  console.log(`   ✅ Success: ${mixedSuccess}, ❌ Failed: ${mixedFailed}\n`);

  // Test 3: Invalid requests mixed with valid ones
  console.log('📋 Test 3: Valid and invalid requests mixed (20 total)');
  const invalidMixPromises = [];
  for (let i = 0; i < 20; i++) {
    const payload = i % 3 === 0 ? {} : generateTestData(i); // Every 3rd is invalid
    invalidMixPromises.push(
      callEdgeFunction('analyze-sales-readiness', payload)
    );
  }
  
  const invalidMixResults = await Promise.all(invalidMixPromises);
  const invalidMixSuccess = invalidMixResults.filter(r => r.success).length;
  const invalidMixFailed = invalidMixResults.filter(r => !r.success).length;
  console.log(`   ✅ Success: ${invalidMixSuccess}, ❌ Failed: ${invalidMixFailed}`);
  console.log(`   Expected failures: 7 (empty payloads)\n`);

  // Test 4: Same payload multiple times
  console.log('📋 Test 4: Same payload sent 10 times rapidly');
  const duplicatePayload = {
    companyId: `duplicate-test-${Date.now()}`,
    valuationId: `duplicate-valuation-${Date.now()}`
  };
  
  const duplicatePromises = [];
  for (let i = 0; i < 10; i++) {
    duplicatePromises.push(
      callEdgeFunction('analyze-sales-readiness', duplicatePayload)
    );
  }
  
  const duplicateResults = await Promise.all(duplicatePromises);
  const duplicateSuccess = duplicateResults.filter(r => r.success).length;
  const uniqueQueueIds = new Set(duplicateResults.filter(r => r.success).map(r => r.data.queueMessageId));
  console.log(`   ✅ Success: ${duplicateSuccess}, Unique Queue IDs: ${uniqueQueueIds.size}`);
  console.log(`   All Queue IDs: ${Array.from(uniqueQueueIds).join(', ')}\n`);

  // Test 5: Large payload
  console.log('📋 Test 5: Large payload test');
  const largePayload = {
    companyId: `large-company-${Date.now()}`,
    valuationId: `large-valuation-${Date.now()}`,
    metadata: {
      description: 'A'.repeat(10000), // 10KB of data
      tags: Array(100).fill('tag'),
      nested: {
        level1: {
          level2: {
            level3: {
              data: Array(50).fill({ key: 'value' })
            }
          }
        }
      }
    }
  };
  
  const largeResult = await callEdgeFunction('analyze-sales-readiness', largePayload);
  console.log(`   ${largeResult.success ? '✅ Success' : '❌ Failed'} (${largeResult.status})`);
  if (largeResult.success) {
    console.log(`   Queue ID: ${largeResult.data.queueMessageId}`);
  } else {
    console.log(`   Error: ${JSON.stringify(largeResult.error)}`);
  }
  console.log(`   Payload size: ~${JSON.stringify(largePayload).length} bytes\n`);

  // Test 6: Sequential vs Parallel timing
  console.log('📋 Test 6: Sequential vs Parallel timing comparison');
  
  // Sequential
  const sequentialStart = Date.now();
  for (let i = 0; i < 5; i++) {
    await callEdgeFunction('analyze-sales-readiness', generateTestData(i));
  }
  const sequentialTime = Date.now() - sequentialStart;
  
  // Parallel
  const parallelStart = Date.now();
  const parallelPromises = [];
  for (let i = 0; i < 5; i++) {
    parallelPromises.push(callEdgeFunction('analyze-sales-readiness', generateTestData(i + 100)));
  }
  await Promise.all(parallelPromises);
  const parallelTime = Date.now() - parallelStart;
  
  console.log(`   Sequential (5 requests): ${sequentialTime}ms`);
  console.log(`   Parallel (5 requests): ${parallelTime}ms`);
  console.log(`   Speed improvement: ${Math.round((sequentialTime / parallelTime - 1) * 100)}%\n`);

  // Test 7: Error recovery
  console.log('📋 Test 7: Error recovery test');
  const errorTests = [
    { name: 'Empty payload', payload: {} },
    { name: 'Null companyId', payload: { companyId: null } },
    { name: 'Invalid type', payload: { companyId: 123 } }, // Number instead of string
    { name: 'Missing all required', payload: { randomField: 'test' } }
  ];
  
  for (const test of errorTests) {
    const result = await callEdgeFunction('analyze-sales-readiness', test.payload);
    console.log(`   ${test.name}: ${result.success ? '✅' : '❌'} (${result.status})`);
  }

  console.log('\n🏁 Heavy tests completed');
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`Total requests sent: ~106`);
  console.log(`Functions tested: analyze-sales-readiness, analyze-post-dd-readiness`);
  console.log(`Test scenarios: Burst, Mixed, Invalid, Duplicate, Large payload, Timing, Error recovery`);
}

// Run the tests
runHeavyTests().catch(console.error);