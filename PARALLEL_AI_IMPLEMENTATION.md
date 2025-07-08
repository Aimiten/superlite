# Parallel AI Model Implementation

This document describes the implementation of parallel AI model calls using both Gemini and Claude.

## Overview

The system now supports calling both Gemini 2.5 Pro and Claude 3.5 Sonnet in parallel, using whichever responds first. This improves reliability and response time.

## Implementation Details

### New Files

1. **`/supabase/functions/analyze-sales-readiness/utils/claude-client.ts`**
   - Handles Claude API integration
   - Implements retry logic with exponential backoff
   - Normalizes Claude responses to match Gemini's format

2. **`/supabase/functions/analyze-sales-readiness/utils/ai-client-manager.ts`**
   - Manages parallel calls to both AI providers
   - Uses `Promise.race()` to get the fastest response
   - Falls back to the other provider if one fails
   - Works with single provider if only one API key is available

### Modified Files

1. **`/supabase/functions/process-sales-analysis-queue/index.ts`**
   - Changed from `callGeminiModel` to `callAIModel`
   - No other changes needed - interface remains the same

2. **`/supabase/functions/process-post-dd-analysis-queue/index.ts`**
   - Changed from `callGeminiModel` to `callAIModel`
   - No other changes needed - interface remains the same

## Configuration

### Environment Variables

Add the following to your Supabase environment:

```bash
# Existing Gemini key
GEMINI_API_KEY=your-gemini-api-key

# New Claude key
CLAUDE_API_KEY=your-claude-api-key
```

### Deployment

Deploy the updated functions:

```bash
# Deploy individual functions
npx supabase functions deploy process-sales-analysis-queue
npx supabase functions deploy process-post-dd-analysis-queue
npx supabase functions deploy analyze-sales-readiness

# Or deploy all functions
npm run supabase:functions:deploy
```

## How It Works

1. When an AI call is made, the system checks which API keys are available
2. If both keys exist, it calls both models in parallel
3. The first successful response is used
4. If one fails, the system automatically uses the other
5. If only one API key is configured, it uses that provider exclusively

## Benefits

- **Improved Reliability**: If Gemini blocks a request (e.g., due to safety filters), Claude can still respond
- **Faster Response Times**: Uses whichever model responds first
- **Automatic Fallback**: Continues working even if one provider has issues
- **Backward Compatible**: Works with existing Gemini-only setup

## Monitoring

The system logs which provider responds first:

```
[AI Manager] Racing both providers...
[AI Manager] Claude responded first
```

Or in case of failures:

```
[AI Manager] Gemini failed: [error message]
[AI Manager] Fallback to Claude succeeded
```

## Testing

To test the implementation:

1. Set both API keys in your environment
2. Trigger a sales readiness analysis
3. Check the logs to see which provider responded
4. Try removing one API key to test single-provider mode

## Notes

- Claude doesn't support PDF uploads in the same way as Gemini
- Both models are configured with low temperature (0.1) for consistent results
- The response format is normalized to match Gemini's structure
- Error handling ensures the system continues working even if one provider fails