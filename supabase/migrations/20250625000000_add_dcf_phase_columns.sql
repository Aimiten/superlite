-- Add missing columns to dcf_scenario_analyses table for Phase 1/2 separation
-- This migration adds columns needed for saving Phase 1 results separately

-- First, update the status check constraint to include phase1_completed
ALTER TABLE dcf_scenario_analyses 
DROP CONSTRAINT dcf_scenario_analyses_status_check;

ALTER TABLE dcf_scenario_analyses 
ADD CONSTRAINT dcf_scenario_analyses_status_check 
CHECK (status IN ('processing', 'phase1_completed', 'completed', 'failed'));

-- Add new columns for variant selection and market data
ALTER TABLE dcf_scenario_analyses 
ADD COLUMN variant_selected TEXT,
ADD COLUMN variant_confidence INTEGER,
ADD COLUMN variant_reasoning TEXT,
ADD COLUMN market_data_used JSONB,
ADD COLUMN validation_results JSONB,
ADD COLUMN execution_metadata JSONB,
ADD COLUMN error_details TEXT;

-- Add comments for new columns
COMMENT ON COLUMN dcf_scenario_analyses.variant_selected IS 'Selected DCF variant: full_dcf, simplified_dcf, or forward_looking_dcf';
COMMENT ON COLUMN dcf_scenario_analyses.variant_confidence IS 'Confidence score (1-10) for the selected variant';
COMMENT ON COLUMN dcf_scenario_analyses.variant_reasoning IS 'Explanation for why this variant was selected';
COMMENT ON COLUMN dcf_scenario_analyses.market_data_used IS 'Market data from ECB, Eurostat, Damodaran used in analysis';
COMMENT ON COLUMN dcf_scenario_analyses.validation_results IS 'Validation results from DCF calculations';
COMMENT ON COLUMN dcf_scenario_analyses.execution_metadata IS 'Metadata about execution time, models used, etc';
COMMENT ON COLUMN dcf_scenario_analyses.error_details IS 'Detailed error information if analysis failed';