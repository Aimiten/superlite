#!/usr/bin/env node

// Massive payload test script for queue functions
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rmkleyyzieacwltcbgzs.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('Please set VITE_SUPABASE_ANON_KEY environment variable');
  process.exit(1);
}

// Generate large data
function generateLargeData(sizeMB) {
  const sizeBytes = sizeMB * 1024 * 1024;
  const chunkSize = 1024; // 1KB chunks
  const chunks = Math.floor(sizeBytes / chunkSize);
  
  // Simulate PDF metadata
  const pdfMetadata = {
    type: 'application/pdf',
    pages: Math.floor(sizeMB * 10),
    title: `Large Document ${sizeMB}MB`,
    created: new Date().toISOString()
  };
  
  // Generate base64-like string to simulate encoded PDF
  const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let largeContent = '';
  
  for (let i = 0; i < chunks; i++) {
    let chunk = '';
    for (let j = 0; j < chunkSize; j++) {
      chunk += base64Chars[Math.floor(Math.random() * base64Chars.length)];
    }
    largeContent += chunk;
  }
  
  return {
    metadata: pdfMetadata,
    content: largeContent,
    actualSize: largeContent.length
  };
}

// Helper function to call edge function
async function callEdgeFunction(functionName, payload) {
  const startTime = Date.now();
  
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

    const duration = Date.now() - startTime;
    const data = await response.json();
    
    return {
      success: response.ok,
      data: response.ok ? data : null,
      error: !response.ok ? data : null,
      status: response.status,
      duration: duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      error: error.message,
      status: 0,
      duration: duration
    };
  }
}

// Run massive payload tests
async function runMassiveTests() {
  console.log('🏋️ Starting MASSIVE payload queue function tests...\n');
  console.log('🔌 Using Supabase URL:', SUPABASE_URL);
  console.log('🔑 Using API Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

  const payloadSizes = [0.1, 0.5, 1, 2, 3, 4, 5]; // MB
  const results = [];

  for (const sizeMB of payloadSizes) {
    console.log(`\n📦 Testing with ${sizeMB}MB payload...`);
    
    const largeData = generateLargeData(sizeMB);
    const payload = {
      companyId: `massive-test-${Date.now()}`,
      valuationId: `massive-valuation-${Date.now()}`,
      documents: {
        pdf: largeData.content,
        metadata: largeData.metadata
      },
      additionalData: {
        testSize: `${sizeMB}MB`,
        timestamp: new Date().toISOString()
      }
    };
    
    const payloadSize = JSON.stringify(payload).length;
    console.log(`   Actual payload size: ${(payloadSize / 1024 / 1024).toFixed(2)}MB (${payloadSize} bytes)`);
    
    const result = await callEdgeFunction('analyze-sales-readiness', payload);
    
    results.push({
      sizeMB: sizeMB,
      payloadBytes: payloadSize,
      success: result.success,
      status: result.status,
      duration: result.duration,
      error: result.error
    });
    
    console.log(`   ${result.success ? '✅ Success' : '❌ Failed'} (${result.status}) - ${result.duration}ms`);
    if (result.success) {
      console.log(`   Queue ID: ${result.data.queueMessageId}`);
    } else {
      console.log(`   Error: ${JSON.stringify(result.error)}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Test with documents array
  console.log('\n📚 Testing with multiple documents array...');
  const multiDocPayload = {
    companyId: `multi-doc-test-${Date.now()}`,
    valuationId: `multi-doc-valuation-${Date.now()}`,
    documents: [
      {
        name: 'document1.pdf',
        content: generateLargeData(0.5).content,
        type: 'application/pdf'
      },
      {
        name: 'document2.pdf',
        content: generateLargeData(0.5).content,
        type: 'application/pdf'
      },
      {
        name: 'document3.pdf',
        content: generateLargeData(0.5).content,
        type: 'application/pdf'
      }
    ]
  };
  
  const multiDocSize = JSON.stringify(multiDocPayload).length;
  console.log(`   Total payload size: ${(multiDocSize / 1024 / 1024).toFixed(2)}MB`);
  
  const multiDocResult = await callEdgeFunction('analyze-sales-readiness', multiDocPayload);
  console.log(`   ${multiDocResult.success ? '✅ Success' : '❌ Failed'} (${multiDocResult.status}) - ${multiDocResult.duration}ms`);
  
  // Summary
  console.log('\n📊 Summary of payload size tests:');
  console.log('Size (MB) | Status | Duration (ms) | Success');
  console.log('----------|--------|---------------|--------');
  results.forEach(r => {
    console.log(`${r.sizeMB.toFixed(1).padStart(9)} | ${String(r.status).padStart(6)} | ${String(r.duration).padStart(13)} | ${r.success ? '✅' : '❌'}`);
  });
  
  // Find the breaking point
  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log(`\n⚠️ Breaking point: Failures start at ${failedResults[0].sizeMB}MB`);
  } else {
    console.log('\n✅ All payload sizes succeeded!');
  }
  
  // Performance analysis
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const avgDuration = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
    const maxDuration = Math.max(...successfulResults.map(r => r.duration));
    const minDuration = Math.min(...successfulResults.map(r => r.duration));
    
    console.log('\n⏱️ Performance metrics:');
    console.log(`   Average duration: ${Math.round(avgDuration)}ms`);
    console.log(`   Min duration: ${minDuration}ms`);
    console.log(`   Max duration: ${maxDuration}ms`);
  }
  
  console.log('\n🏁 Massive payload tests completed');
}

// Run the tests
runMassiveTests().catch(console.error);