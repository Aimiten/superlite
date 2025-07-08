-- DCF Scenario Analyses table for storing Claude Sonnet 4 financial analysis results
-- This table stores both raw analysis text and structured JSON data from DCF calculations

CREATE TABLE dcf_scenario_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User and company references
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  valuation_id UUID REFERENCES valuations(id) ON DELETE CASCADE NOT NULL,
  
  -- Analysis status and metadata
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')) NOT NULL,
  error_message TEXT,
  analysis_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Claude analysis results
  raw_analysis TEXT, -- Phase 1: Free-form Claude analysis
  structured_data JSONB, -- Phase 2: Structured JSON data
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE dcf_scenario_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own DCF analyses
CREATE POLICY "Users can access own DCF analyses" ON dcf_scenario_analyses 
FOR ALL USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_dcf_analyses_user_id ON dcf_scenario_analyses(user_id);
CREATE INDEX idx_dcf_analyses_company_id ON dcf_scenario_analyses(company_id);
CREATE INDEX idx_dcf_analyses_valuation_id ON dcf_scenario_analyses(valuation_id);
CREATE INDEX idx_dcf_analyses_status ON dcf_scenario_analyses(status);
CREATE INDEX idx_dcf_analyses_user_status ON dcf_scenario_analyses(user_id, status);
CREATE INDEX idx_dcf_analyses_created_at ON dcf_scenario_analyses(created_at DESC);

-- Composite index for common query pattern: user + valuation + status
CREATE INDEX idx_dcf_analyses_user_valuation_status ON dcf_scenario_analyses(user_id, valuation_id, status);

-- Add comment for documentation
COMMENT ON TABLE dcf_scenario_analyses IS 'Stores DCF scenario analysis results from Claude Sonnet 4, including both raw analysis text and structured JSON data with historical trends and future projections';
COMMENT ON COLUMN dcf_scenario_analyses.raw_analysis IS 'Phase 1: Claude Sonnet free-form financial analysis text';
COMMENT ON COLUMN dcf_scenario_analyses.structured_data IS 'Phase 2: Structured JSON containing historical analysis, DCF projections, and recommendations';
COMMENT ON COLUMN dcf_scenario_analyses.status IS 'Analysis status: processing (in progress), completed (success), failed (error occurred)';