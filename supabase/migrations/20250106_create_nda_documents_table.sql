-- Create NDA documents table
CREATE TABLE IF NOT EXISTS nda_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  
  -- Tyyppi ja status
  nda_type TEXT NOT NULL CHECK (nda_type IN ('unilateral', 'mutual', 'dd', 'advisor')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'signed', 'expired')),
  
  -- Osapuolten tiedot (JSONB rakenteelliselle datalle)
  disclosing_party JSONB NOT NULL,
  receiving_party JSONB NOT NULL,
  
  -- Sopimusehdot
  terms JSONB NOT NULL,
  
  -- Generoidut dokumentit
  content_markdown TEXT,
  content_html TEXT,
  storage_path TEXT, -- PDF Supabase Storagessa
  
  -- Allekirjoitukset (myöhempää kehitystä varten)
  signature_status JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Varmista että osapuolilla on nimet
  CONSTRAINT valid_parties CHECK (
    disclosing_party->>'name' IS NOT NULL AND 
    receiving_party->>'name' IS NOT NULL
  )
);

-- RLS-politiikat
ALTER TABLE nda_documents ENABLE ROW LEVEL SECURITY;

-- Käyttäjät näkevät vain oman yrityksensä NDA:t
CREATE POLICY "Users can view own company NDAs" ON nda_documents
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE user_id = auth.uid()
    )
  );

-- Käyttäjät voivat luoda NDA:ita omalle yritykselleen
CREATE POLICY "Users can create NDAs for own company" ON nda_documents
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies 
      WHERE user_id = auth.uid()
    )
  );

-- Käyttäjät voivat päivittää oman yrityksensä NDA:ita
CREATE POLICY "Users can update own company NDAs" ON nda_documents
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE user_id = auth.uid()
    )
  );

-- Indeksit suorituskyvyn optimointiin
CREATE INDEX idx_nda_documents_company_id ON nda_documents(company_id);
CREATE INDEX idx_nda_documents_created_at ON nda_documents(created_at DESC);
CREATE INDEX idx_nda_documents_status ON nda_documents(status);
CREATE INDEX idx_nda_documents_nda_type ON nda_documents(nda_type);

-- Trigger päivittämään updated_at
CREATE OR REPLACE FUNCTION update_nda_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nda_documents_updated_at
  BEFORE UPDATE ON nda_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_nda_documents_updated_at();

-- Luo storage bucket NDA-dokumenteille
INSERT INTO storage.buckets (id, name, public)
VALUES ('nda-documents', 'nda-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage-politiikat
CREATE POLICY "Users can upload NDA documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'nda-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own NDA documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'nda-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Kommentti taulusta
COMMENT ON TABLE nda_documents IS 'Salassapitosopimusten (NDA) tallennustaulu';
COMMENT ON COLUMN nda_documents.nda_type IS 'NDA-tyyppi: unilateral (yksipuolinen), mutual (molemminpuolinen), dd (due diligence), advisor (neuvonantaja)';
COMMENT ON COLUMN nda_documents.disclosing_party IS 'Luottamuksellisen tiedon luovuttajan tiedot (name, businessId, address, contactPerson, email)';
COMMENT ON COLUMN nda_documents.receiving_party IS 'Luottamuksellisen tiedon vastaanottajan tiedot (name, businessId, address, contactPerson, email)';
COMMENT ON COLUMN nda_documents.terms IS 'Sopimusehdot (duration, effectiveDate, confidentialInfo, exceptions, governingLaw, disputeResolution)';