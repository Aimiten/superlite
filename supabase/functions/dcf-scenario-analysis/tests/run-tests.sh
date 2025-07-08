#!/bin/bash

# DCF Scenario Analysis Test Runner
# Run integration tests with mock data

echo "=== DCF Scenario Analysis Test Suite ==="
echo "Running integration tests with mock data..."
echo ""

# Set test environment variables (mock values)
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_SERVICE_ROLE_KEY="mock-service-role-key"
export GEMINI_API_KEY="mock-gemini-key"
export ANTHROPIC_API_KEY="mock-anthropic-key"

# Run tests with Deno
deno test \
  --allow-net \
  --allow-env \
  --allow-read \
  integration.test.ts \
  --filter="" \
  --reporter=pretty

# Run with performance benchmarks
echo ""
echo "=== Running Performance Benchmarks ==="
deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  integration.test.ts

echo ""
echo "Tests completed!"