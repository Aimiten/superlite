// supabase/functions/send-nda-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.29.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Ympäristömuuttujat puuttuvat");
    }

    // Parse request
    const { ndaId, recipientEmail, message } = await req.json();

    if (!ndaId || !recipientEmail) {
      throw new Error("Pakolliset parametrit puuttuvat");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Kirjautuminen vaaditaan");
    }

    // Get NDA document
    const { data: nda, error: ndaError } = await supabase
      .from('nda_documents')
      .select(`
        *,
        companies!nda_documents_company_id_fkey (
          name,
          business_id
        )
      `)
      .eq('id', ndaId)
      .single();

    if (ndaError || !nda) {
      throw new Error("NDA-dokumenttia ei löytynyt");
    }

    // Verify user has access to this NDA
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('id', nda.company_id)
      .eq('user_id', user.id)
      .single();

    if (!company) {
      throw new Error("Ei oikeutta tähän dokumenttiin");
    }

    // Get PDF URL if exists
    let pdfUrl = null;
    if (nda.storage_path) {
      const { data: signedUrlData } = await supabase.storage
        .from('nda-documents')
        .createSignedUrl(nda.storage_path, 60 * 60 * 24); // 24h
      
      pdfUrl = signedUrlData?.signedUrl;
    }

    // Format email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Salassapitosopimus</h2>
        
        <p>Hei,</p>
        
        <p>${nda.companies?.name || 'Lähettäjä'} on lähettänyt sinulle salassapitosopimuksen (NDA) tarkastettavaksi ja allekirjoitettavaksi.</p>
        
        ${message ? `<p><strong>Viesti lähettäjältä:</strong><br>${message}</p>` : ''}
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Sopimuksen tiedot:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Tyyppi:</strong> ${getNDATypeLabel(nda.nda_type)}</li>
            <li><strong>Luovuttaja:</strong> ${nda.disclosing_party.name}</li>
            <li><strong>Vastaanottaja:</strong> ${nda.receiving_party.name}</li>
            <li><strong>Luotu:</strong> ${new Date(nda.created_at).toLocaleDateString('fi-FI')}</li>
          </ul>
        </div>
        
        ${pdfUrl ? `
          <p style="margin-top: 30px;">
            <a href="${pdfUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Lataa ja tarkasta NDA (PDF)
            </a>
          </p>
        ` : ''}
        
        <hr style="margin: 40px 0; border: none; border-top: 1px solid #ddd;">
        
        <p style="color: #666; font-size: 14px;">
          Tämä viesti on lähetetty Arvento-palvelusta. Jos et odottanut tätä viestiä, voit jättää sen huomiotta.
        </p>
      </div>
    `;

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Arvento <noreply@arvento.fi>',
        to: recipientEmail,
        subject: `Salassapitosopimus - ${nda.companies?.name || 'NDA'}`,
        html: emailHtml,
        reply_to: user.email
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error('Resend API error:', error);
      throw new Error('Sähköpostin lähetys epäonnistui');
    }

    const resendData = await resendResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: resendData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error("Error in send-nda-email:", error);

    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Tuntematon virhe",
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getNDATypeLabel(type: string): string {
  const labels: Record<string, string> = {
    unilateral: 'Yksipuolinen NDA',
    mutual: 'Molemminpuolinen NDA',
    dd: 'Due Diligence NDA',
    advisor: 'Neuvonantaja NDA'
  };
  return labels[type] || type;
}