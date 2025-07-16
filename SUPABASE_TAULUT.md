# SUPABASE TIETOKANTATAULUT - TARKISTUSRAPORTTI

Päivitetty: 2025-01-15

## NYKYTILA

### ✅ OLEMASSA OLEVAT TAULUT (public schema):
- companies
- company_documents
- company_info
- company_sharing
- dcf_scenario_analyses
- feedback
- industry_data
- profiles
- share_comments
- share_view_logs
- stripe_customers
- subscriptions
- valuation_document_analysis
- valuation_simulations
- valuations

### ❌ PUUTTUVAT TAULUT:
1. **ai_conversation_files** - AI-keskustelujen liitetiedostot
2. **ai_conversations** - AI-keskustelut ja viestit
3. **free_calculator_errors** - Ilmaislaskurin virhelokit
4. **free_calculator_results** - Ilmaislaskurin tulokset
5. **free_valuations** - Ilmaisarvioinnit
6. **nda_acceptances** - NDA-hyväksynnät
7. **nda_documents** - NDA-dokumentit
8. **user_multiplier_settings** - Käyttäjäkohtaiset kertoimet
9. **valuation_impact_analysis** - Vaikutusanalyysit
10. **wrappers_fdw_stats** - FDW tilastot

### ❌ PUUTTUVAT PGMQ JONOT:
- **pgmq.q_dcf_analysis_queue** - DCF-analyysin aktiivijono
- **pgmq.a_dcf_analysis_queue** - DCF-analyysin arkisto

### ✅ OLEMASSA OLEVAT PGMQ JONOT:
- pgmq.q_valuation_document_analysis_queue
- pgmq.a_valuation_document_analysis_queue
- pgmq.meta (sisäinen taulu)

## KRIITTISET PUUTTUVAT OMINAISUUDET

### 1. AI-KESKUSTELUT
- Taulut: `ai_conversations`, `ai_conversation_files`
- Vaikutus: AI-assistentti ei toimi

### 2. NDA-TOIMINNOT
- Taulut: `nda_documents`, `nda_acceptances`
- Vaikutus: NDA-dokumenttien hallinta ei toimi

### 3. KÄYTTÄJÄASETUKSET
- Taulu: `user_multiplier_settings`
- Vaikutus: Käyttäjä ei voi tallentaa omia kertoimiaan

### 4. DCF-ANALYYSI
- Jonot: DCF pgmq jonot
- Vaikutus: DCF-skenaariot eivät toimi asynkronisesti

### 5. ILMAISLASKURIT
- Taulut: `free_calculator_*`, `free_valuations`
- Vaikutus: Ilmaistoiminnot eivät toimi

## HUOMIOITA

### Poistetut ominaisuudet (EI tarvita):
- assessments
- company_tasks
- task_responses

### Ylimääräiset taulut:
- industry_data (tarvitaan DCF:ssä, vaikka ei ole tyypeissä)

### Storage Buckets (tarkista erikseen):
- company-files
- conversation_files
- feedback-screenshots
- nda-documents
- task-files (poistettu ominaisuus?)

## TOIMENPITEET

1. **Luo puuttuvat taulut** - Tarvitaan migraatiot tai SQL-skriptit
2. **Luo DCF-jonot** - `SELECT pgmq.create_if_not_exists('dcf_analysis_queue');`
3. **Tarkista storage buckets** - Varmista että kaikki tarvittavat bucketit ovat olemassa
4. **Päivitä tyyppitiedostot** - Lisää industry_data tyyppeihin

## SQL TARKISTUSKYSELYT

### Tarkista public taulut:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### Tarkista pgmq jonot:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'pgmq'
ORDER BY tablename;
```

### Tarkista storage buckets:
```sql
SELECT name FROM storage.buckets
ORDER BY name;
```