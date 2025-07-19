-- Create table for free calculator results
CREATE TABLE IF NOT EXISTS public.free_calculator_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Company info
  company_name TEXT NOT NULL,
  business_id TEXT NOT NULL,
  company_info JSONB NOT NULL,
  
  -- Financial data
  financial_data JSONB NOT NULL,
  
  -- Multipliers and calculations
  multipliers JSONB NOT NULL,
  calculations JSONB NOT NULL,
  
  -- User rating (1-5 stars)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for business_id lookups
CREATE INDEX IF NOT EXISTS idx_free_calculator_results_business_id ON public.free_calculator_results(business_id);

-- Create index for created_at for analytics
CREATE INDEX IF NOT EXISTS idx_free_calculator_results_created_at ON public.free_calculator_results(created_at);

-- Create index for company_name lookups (for cache queries)
CREATE INDEX IF NOT EXISTS idx_free_calculator_results_company_name ON public.free_calculator_results(company_name);

-- Create table for free calculator errors (for debugging)
CREATE TABLE IF NOT EXISTS public.free_calculator_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Error details
  error_message TEXT NOT NULL,
  search_term TEXT,
  edge_function TEXT,
  
  -- Additional context
  context JSONB,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for error lookups
CREATE INDEX IF NOT EXISTS idx_free_calculator_errors_created_at ON public.free_calculator_errors(created_at);

-- Enable RLS
ALTER TABLE public.free_calculator_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_calculator_errors ENABLE ROW LEVEL SECURITY;

-- Create policies for free calculator results
-- Anyone can insert (for free calculator)
CREATE POLICY "Anyone can insert free calculator results" 
  ON public.free_calculator_results
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can read their own results (based on created_at within 24 hours)
CREATE POLICY "Read own recent free calculator results" 
  ON public.free_calculator_results
  FOR SELECT 
  TO anon, authenticated
  USING (created_at > NOW() - INTERVAL '24 hours');

-- Anyone can update rating on their own results
CREATE POLICY "Update rating on recent results"
  ON public.free_calculator_results
  FOR UPDATE
  TO anon, authenticated
  USING (created_at > NOW() - INTERVAL '24 hours')
  WITH CHECK (created_at > NOW() - INTERVAL '24 hours');

-- Admin access for errors table
CREATE POLICY "Service role can manage errors"
  ON public.free_calculator_errors
  FOR ALL
  TO service_role
  WITH CHECK (true);