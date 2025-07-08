# DCF Scenario Analysis Tests

## Overview

This directory contains integration tests for the DCF (Discounted Cash Flow) scenario analysis functionality. The tests cover all three DCF variants:

1. **Full DCF** - Complete analysis with comprehensive financial data
2. **Simplified DCF** - Streamlined analysis for limited data scenarios  
3. **Forward-looking DCF** - Projection-based analysis for early-stage companies

## Test Coverage

### 1. Variant Selection Tests
- Tests the logic for selecting appropriate DCF variant based on data availability
- Validates confidence scoring and reasoning
- Covers edge cases with missing or limited data

### 2. Variant Execution Tests
- Tests the execution of each DCF variant
- Validates output structure and calculations
- Includes performance benchmarks (target: 50% faster than v1)

### 3. Error Handling Tests
- Missing valuation data
- Invalid financial data
- API failures and timeouts

### 4. Performance Benchmarks
- Variant selection speed (target: <10ms)
- Data transformation speed (target: <1ms)
- Full analysis execution (target: <30s)

## Running Tests

### Local Development

```bash
# Run all tests with mock data
./run-tests.sh

# Run specific test
deno test integration.test.ts --filter="Variant Selection"

# Run with real API keys (set environment variables first)
export GEMINI_API_KEY="your-key"
export ANTHROPIC_API_KEY="your-key"
deno test integration.test.ts --allow-all
```

### CI/CD Pipeline

Tests run automatically on push/PR with mock data. Real API tests are skipped in CI to avoid rate limits.

## Mock Data

The tests use realistic mock data including:

- 3 years of financial statements
- Balance sheet and income statement data
- Market data (risk-free rate, industry beta, etc.)
- Company and valuation metadata

## Performance Targets

Based on the new V2 implementation with parameter extraction:

- **Variant Selection**: <10ms
- **Data Transformation**: <1ms per period
- **Full Analysis**: <30s (50% improvement over V1)
- **Memory Usage**: <512MB peak

## Adding New Tests

When adding new tests:

1. Follow the existing pattern for test structure
2. Use descriptive test names
3. Include both positive and negative test cases
4. Add performance benchmarks for new features
5. Update this README with new coverage

## Debugging

Enable debug logs:
```bash
export DEBUG=true
deno test integration.test.ts --allow-all
```

View memory usage:
```bash
deno test integration.test.ts --allow-all --v8-flags=--expose-gc
```