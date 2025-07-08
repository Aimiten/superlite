# DCF Validation Module

This module provides comprehensive validation for DCF (Discounted Cash Flow) scenario analysis parameters and inputs.

## Features

### Parameter Validation
- Validates all extracted parameters from Gemini AI before calculation
- Checks required fields based on company type (SaaS, Traditional, Growth, Mature)
- Validates value ranges for all financial metrics
- Ensures scenario consistency (conservative < base < optimistic)
- Validates WACC > terminal growth rate relationship

### Input Validation
- Validates DCF calculation inputs before processing
- Variant-specific validation (Full DCF, Simplified DCF, Forward-looking DCF)
- Historical data validation and CAGR calculations
- Market data and benchmark validation

### Error Handling
- Critical errors that prevent calculation
- Regular errors that need fixing
- Warnings for unusual but acceptable values
- Suggestions for improving data quality

## Usage

```typescript
import { dcfValidator } from './validation/dcf-validator.ts';

// Validate extracted parameters
const validationResult = dcfValidator.validateExtractedParameters(
  extractedParams,
  'saas', // company type
  0.10    // market WACC
);

if (!validationResult.isValid) {
  console.error('Validation failed:', validationResult.errors);
  throw new Error(validationResult.summary);
}

// Validate DCF inputs
const inputValidation = dcfValidator.validateDCFInputs(dcfInputs);

if (inputValidation.warnings.length > 0) {
  console.warn('Validation warnings:', inputValidation.warnings);
}
```

## Validation Rules

### Growth Rates
- Maximum: 200% (-50% minimum)
- Warning if > 50%
- Should generally decline over projection period

### Margins
- Range: -50% to 50%
- Warning if > 35% (very high)
- Path to profitability required for negative margins

### WACC
- Range: 2% to 30%
- Must be greater than terminal growth rate
- Compared against market WACC if available

### Terminal Growth
- Maximum: 5% (typically 2-3%)
- Must be less than WACC
- Warning if above typical GDP growth

### Revenue
- Must be positive
- Warning if suspiciously low or high

### Company Type Specific

#### SaaS
- Churn rate warnings if > 30%
- Recurring revenue should be > 70%
- LTV/CAC validation

#### Traditional
- Inventory turnover > 2x recommended
- Cash conversion cycle < 90 days
- Working capital efficiency

#### Growth
- R&D spending > 5% expected
- Customer growth vs revenue growth consistency
- Market share expansion realism

#### Mature
- Dividend payout sustainability
- Market share stability expectations
- Asset utilization rates

## Error Types

### Critical Errors
- Missing required structure
- Null or undefined values
- WACC <= terminal growth rate

### Regular Errors
- Values outside acceptable ranges
- Missing required fields
- Invalid array lengths

### Warnings
- Unusual but valid values
- Inconsistent growth patterns
- High reliance on benchmarks

## Integration

The validator is integrated into the DCF calculation flow:

1. Parameters extracted from documents (Gemini AI)
2. **Validation of extracted parameters**
3. Transform to DCF inputs
4. **Validation of DCF inputs**
5. DCF calculation
6. Results with validation summary

## Logging

All validation steps are logged with timestamps:
- Parameter validation results
- Input validation results
- Specific errors and warnings
- Validation summary in final output