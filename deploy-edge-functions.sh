#!/bin/bash

echo "🚀 Deploying Supabase Edge Functions..."

# Deploy company-preview
echo "📦 Deploying company-preview..."
supabase functions deploy company-preview

# Deploy enhanced-calculator  
echo "📦 Deploying enhanced-calculator..."
supabase functions deploy enhanced-calculator

echo "✅ All edge functions deployed!"
echo ""
echo "⚠️  Remember to add environment variables in Supabase dashboard:"
echo "   - FIRECRAWL_API_KEY"
echo "   - PERPLEXITY_API_KEY"
echo "   - GOOGLE_AI_API_KEY"