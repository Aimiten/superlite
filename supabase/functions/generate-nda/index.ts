// supabase/functions/generate-nda/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.29.0';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";
import { marked } from 'https://esm.sh/marked@4.0.10';

const GEMINI_MODEL = "gemini-2.5-flash";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Ympäristömuuttujat puuttuvat");
    }

    // Parse request - always sharing context now
    const { companyId, formData, sharingData } = await req.json();

    if (!companyId || !formData) {
      throw new Error("Pakolliset parametrit puuttuvat");
    }

    // Initialize Supabase client with auth from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Kirjautuminen vaaditaan");
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false
      },
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Get auth user - auth is already in the client headers
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error("Kirjautuminen vaaditaan");
    }

    // Create NDA record with generating status
    const { data: ndaRecord, error: insertError } = await supabase
      .from('nda_documents')
      .insert({
        company_id: companyId,
        created_by: user.id,
        nda_type: formData.type,
        status: 'generating',
        disclosing_party: formData.disclosingParty,
        receiving_party: formData.receivingParty,
        terms: formData.terms,
        sharing_context: sharingData
      })
      .select()
      .single();

    if (insertError || !ndaRecord) {
      throw new Error("NDA-tietueen luonti epäonnistui");
    }

    try {
      // Generate NDA content with Gemini
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: GEMINI_MODEL,
        generationConfig: {
          temperature: 0.3, // Matalampi lämpötila juridiselle tekstille
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });

      const prompt = createNDAPrompt(formData, sharingData);
      
      let markdownContent: string;
      let retries = 0;
      const maxRetries = 2;
      
      // Retry logic for Gemini
      while (retries <= maxRetries) {
        try {
          const result = await model.generateContent(prompt);
          const response = await result.response;
          markdownContent = response.text();
          
          // Validoi että saatiin järkevä vastaus
          if (!markdownContent || markdownContent.length < 500) {
            throw new Error("Liian lyhyt vastaus Geminiltä");
          }
          
          break;
        } catch (geminiError) {
          retries++;
          if (retries > maxRetries) {
            console.error("Gemini generation failed after retries:", geminiError);
            throw new Error("NDA:n generointi epäonnistui. Yritä hetken kuluttua uudelleen.");
          }
          // Odota ennen uudelleenyritystä
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }

      // Convert markdown to HTML - safely
      let htmlContent: string;
      try {
        htmlContent = marked(markdownContent!);
        
        // Poista potentiaalisesti vaaralliset tagit
        htmlContent = htmlContent
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Poista inline event handlerit
          
      } catch (markdownError) {
        console.error("Markdown conversion error:", markdownError);
        htmlContent = `<pre>${markdownContent!.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
      }

      // Skip PDF generation for now - just use HTML/Markdown
      // PDF generation will be handled client-side if needed
      const fileName = null;

      // Update NDA record with generated content
      const { error: updateError } = await supabase
        .from('nda_documents')
        .update({
          status: 'completed',
          content_markdown: markdownContent!,
          content_html: htmlContent,
          storage_path: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', ndaRecord.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        throw new Error("NDA:n tallennus epäonnistui. Yritä uudelleen.");
      }

      return new Response(
        JSON.stringify({
          id: ndaRecord.id,
          content: markdownContent,
          htmlContent: htmlContent,
          pdfUrl: fileName
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );

    } catch (generationError) {
      // Update status to failed with error message
      const errorMessage = generationError instanceof Error ? generationError.message : 'Tuntematon virhe';
      
      await supabase
        .from('nda_documents')
        .update({
          status: 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', ndaRecord.id);

      console.error("NDA generation failed:", errorMessage);
      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error("Error in generate-nda:", error);

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Tuntematon virhe",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function createNDAPrompt(formData: any, sharingData: any): string {
  // Always unilateral for sharing context
  const agreementType = "yksipuolinen salassapitosopimus luottamuksellisten tietojen jakamisesta arviointia varten";

  const confidentialInfoLabels = {
    liiketoimintatiedot: "liiketoimintatiedot ja -suunnitelmat",
    taloudelliset_tiedot: "taloudelliset tiedot ja laskelmat",
    asiakastiedot: "asiakastiedot ja -sopimukset",
    teknologiatiedot: "teknologiatiedot ja osaaminen",
    hinnoittelutiedot: "hinnoittelutiedot",
    strategiset_suunnitelmat: "strategiset suunnitelmat",
    henkilostotiedot: "henkilöstötiedot",
    immateriaalioikeudet: "immateriaalioikeudet",
    yrityskauppatiedot: "kaikki yrityskauppaneuvotteluihin liittyvät tiedot"
  };

  const exceptionLabels = {
    julkisesti_saatavilla: "julkisesti saatavilla oleva tieto",
    itsenaisesti_kehitetty: "vastaanottajan itsenäisesti kehittämä tieto",
    kolmannelta_osapuolelta: "kolmannelta osapuolelta laillisesti saatu tieto ilman salassapitovelvollisuutta",
    lain_vaatima: "lain tai viranomaisen määräyksestä luovutettava tieto",
    aiemmin_tiedossa: "vastaanottajalla jo ennen sopimusta ollut tieto"
  };

  const duration = {
    '6_months': 'kuusi (6) kuukautta',
    '1_year': 'yksi (1) vuosi',
    '2_years': 'kaksi (2) vuotta',
    '3_years': 'kolme (3) vuotta',
    '5_years': 'viisi (5) vuotta'
  }[formData.terms.duration] || 'kaksi (2) vuotta';

  // Build confidential info list from shared items
  let confidentialInfo: string[] = [];
  
  if (sharingData?.sharedItems) {
    const items = sharingData.sharedItems;
    
    if (items.valuation) {
      confidentialInfo.push('Arvento-arvonmääritysraportti sisältäen DCF-laskelmat, vertailuanalyysin ja riskiarvion');
    }
    if (items.assessment) {
      confidentialInfo.push('Myyntikunto-analyysi ja kehitysehdotukset');
    }
    if (items.documents && items.documents.length > 0) {
      const docList = items.documents.map((d: any) => d.name).join(', ');
      confidentialInfo.push(`Dokumentit: ${docList}`);
    }
    if (items.tasks && items.tasks.length > 0) {
      const taskCount = items.tasks.length;
      const financialTasks = items.tasks.filter((t: any) => t.financial_impact).length;
      confidentialInfo.push(`${taskCount} kehitystehtävää${financialTasks > 0 ? ` (${financialTasks} taloudellisella vaikutuksella)` : ''}`);
    }
  }
  
  // Add any additional specific info
  if (formData.terms.specificConfidentialInfo) {
    confidentialInfo.push(formData.terms.specificConfidentialInfo);
  }

  const exceptions = formData.terms.exceptions
    .map(key => exceptionLabels[key] || key);

  // Map template to recipient context
  const recipientContext = {
    sale_process: 'potentiaaliselle ostajalle, joka arvioi mahdollista yrityskauppaa',
    investment: 'sijoittajalle, joka arvioi sijoitusmahdollisuutta',
    partnership: 'yhteistyökumppanille, joka arvioi yhteistyömahdollisuuksia',
    custom: 'vastaanottajalle määriteltyä tarkoitusta varten'
  };
  
  const recipient = recipientContext[formData.template] || 'vastaanottajalle arviointia varten';

  // Always include Arvento context
  const arventoContext = '\n\nTämä sopimus koskee Arvento-palvelun kautta jaettavia luottamuksellisia tietoja. Vastaanottaja saa käyttää tietoja ainoastaan arviointitarkoitukseen, ei muuhun liiketoimintaan.';

  return `Luo ammattitaitoinen ${agreementType}.${arventoContext}

Sopimus laaditaan ${recipient}.

OSAPUOLET:
Luovuttaja: ${formData.disclosingParty.name} ${formData.disclosingParty.businessId ? `(Y-tunnus: ${formData.disclosingParty.businessId})` : ''}
Vastaanottaja: ${formData.receivingParty.name || 'Tietojen vastaanottaja'} ${formData.receivingParty.businessId ? `(Y-tunnus: ${formData.receivingParty.businessId})` : ''}

SOPIMUSEHDOT:
- Sopimuksen voimaantulo: ${new Date(formData.terms.effectiveDate).toLocaleDateString('fi-FI')}
- Salassapitovelvollisuuden kesto: ${duration}
- Sovellettava laki: Suomen laki
- Riidanratkaisu: ${formData.terms.disputeResolution === 'court' ? `Riidat ratkaistaan ${formData.terms.courtLocation || 'Helsinki'}n käräjäoikeudessa` : 'Riidat ratkaistaan välimiesmenettelyssä Helsingissä Keskuskauppakamarin sääntöjen mukaan'}

LUOTTAMUKSELLINEN TIETO sisältää:
${confidentialInfo.map(item => `- ${item}`).join('\n')}

POIKKEUKSET salassapitovelvollisuudesta:
${exceptions.map(item => `- ${item}`).join('\n')}
${formData.terms.penalty && formData.terms.penalty !== 'none' ? `
Sopimussakko: ${new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(parseInt(formData.terms.penalty))}` : ''}

${formData.terms.additionalTerms ? `Lisäehdot:\n${formData.terms.additionalTerms}\n` : ''}

TÄRKEÄÄ: Luo sopimus, joka:
1. OTSIKKO: "SALASSAPITOSOPIMUS - Luottamuksellisten tietojen jakaminen"
2. JOHDANTO: Toteaa selkeästi että kyse on tietojen jakamisesta Arvento-palvelun kautta ARVIOINTIA varten
3. TARKOITUS: "Luovuttaja jakaa Vastaanottajalle luottamuksellisia tietoja, jotta Vastaanottaja voi arvioida [mahdollista yrityskauppaa/sijoitusmahdollisuutta/yhteistyömahdollisuutta]"
4. SALLITTU KÄYTTÖ: Vastaanottaja saa käyttää tietoja AINOASTAAN arviointiin, ei muuhun liiketoimintaan
5. EI SITOVUUTTA: "Tämä sopimus ei velvoita kumpaakaan osapuolta jatkamaan keskusteluja tai tekemään kauppaa"
6. KESTO: Selkeä määräaika (${duration})
7. PALAUTUS: Tietojen palautus/tuhoaminen arvioinnin päätyttyä tai viimeistään 30 päivän kuluttua pyynnöstä
8. VASTUU: ${formData.terms.penalty && formData.terms.penalty !== 'none' ? 'Sopimussakko määritelty' : 'Rikkomus johtaa vahingonkorvaukseen ilman ennalta määrättyä summaa'}

Käytä markdown-muotoilua. ÄLÄ lisää allekirjoituskohtaa - sopimus hyväksytään sähköisesti.`;
}

// PDF generation removed - will be handled client-side if needed