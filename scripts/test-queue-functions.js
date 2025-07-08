#!/usr/bin/env node

// Test script for queue functions
const https = require('https');
require('dotenv').config({ path: '../.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Helper function to call edge function
async function callEdgeFunction(functionName, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/functions/v1/${functionName}`, SUPABASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: json, status: res.statusCode });
          } else {
            resolve({ success: false, error: json, status: res.statusCode });
          }
        } catch (e) {
          resolve({ success: false, error: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
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
    name: 'Invalid function name',
    function: 'non-existent-function',
    payload: {
      companyId: 'test-company-123'
    }
  }
];

// Run tests
async function runTests() {
  console.log('🧪 Starting queue function tests...\n');
  
  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`   Function: ${testCase.function}`);
    console.log(`   Payload:`, testCase.payload);
    
    try {
      const result = await callEdgeFunction(testCase.function, testCase.payload);
      
      if (result.success) {
        console.log(`   ✅ Success (${result.status}):`, result.data);
      } else {
        console.log(`   ❌ Error (${result.status}):`, result.error);
      }
    } catch (error) {
      console.log(`   💥 Exception:`, error.message);
    }
    
    console.log('');
  }
  
  console.log('🏁 Tests completed');
}

// Run the tests
runTests();