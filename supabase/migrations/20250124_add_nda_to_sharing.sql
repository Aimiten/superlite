-- Add NDA fields to company_sharing table
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS requires_nda BOOLEAN DEFAULT FALSE;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_template TEXT CHECK (nda_template IN ('sale_process', 'investment', 'partnership', 'custom'));
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_config JSONB DEFAULT '{}';
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_specific_info TEXT;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_accepted_by_name TEXT;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_accepted_by_email TEXT;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_accepted_by_company TEXT;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_accepted_by_title TEXT;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_accepted_by_ip TEXT;
ALTER TABLE company_sharing ADD COLUMN IF NOT EXISTS nda_document_id UUID REFERENCES nda_documents(id);

-- Create index for faster NDA status queries
CREATE INDEX IF NOT EXISTS idx_company_sharing_nda_status ON company_sharing(requires_nda, nda_accepted_at);

-- Create NDA acceptances log table
CREATE TABLE IF NOT EXISTS nda_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID REFERENCES company_sharing(id) ON DELETE CASCADE,
  nda_document_id UUID REFERENCES nda_documents(id),
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_by_name TEXT NOT NULL,
  accepted_by_email TEXT NOT NULL,
  accepted_by_company TEXT,
  accepted_by_title TEXT,
  accepted_by_ip TEXT,
  user_agent TEXT,
  acceptance_pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for nda_acceptances
CREATE INDEX IF NOT EXISTS idx_nda_acceptances_share_id ON nda_acceptances(share_id);
CREATE INDEX IF NOT EXISTS idx_nda_acceptances_nda_document_id ON nda_acceptances(nda_document_id);
CREATE INDEX IF NOT EXISTS idx_nda_acceptances_accepted_by_email ON nda_acceptances(accepted_by_email);

-- Enable RLS for nda_acceptances
ALTER TABLE nda_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS policies for nda_acceptances
-- Only the share owner can view acceptances
CREATE POLICY "Share owners can view NDA acceptances" ON nda_acceptances
  FOR SELECT USING (
    share_id IN (
      SELECT id FROM company_sharing 
      WHERE shared_by = auth.uid()
    )
  );

-- System can insert acceptances (through Edge Functions)
CREATE POLICY "System can insert NDA acceptances" ON nda_acceptances
  FOR INSERT WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nda_acceptances_updated_at BEFORE UPDATE ON nda_acceptances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON COLUMN company_sharing.requires_nda IS 'Whether this share requires NDA acceptance before access';
COMMENT ON COLUMN company_sharing.nda_template IS 'Type of NDA template used (sale_process, investment, partnership, custom)';
COMMENT ON COLUMN company_sharing.nda_config IS 'JSON configuration for NDA (duration, penalty, additional terms, etc)';
COMMENT ON COLUMN company_sharing.nda_specific_info IS 'Specific information about what is being protected by the NDA';
COMMENT ON COLUMN company_sharing.nda_accepted_at IS 'Timestamp when NDA was accepted';
COMMENT ON COLUMN company_sharing.nda_accepted_by_name IS 'Name of person who accepted the NDA';
COMMENT ON COLUMN company_sharing.nda_accepted_by_email IS 'Email of person who accepted the NDA';
COMMENT ON COLUMN company_sharing.nda_accepted_by_ip IS 'IP address from which NDA was accepted';
COMMENT ON COLUMN company_sharing.nda_document_id IS 'Reference to the generated NDA document';

COMMENT ON TABLE nda_acceptances IS 'Log of all NDA acceptances for audit trail';