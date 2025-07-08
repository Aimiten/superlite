import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { shareId, signerInfo } = await req.json();

    if (!shareId || !signerInfo?.name || !signerInfo?.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get IP address from headers (server-side)
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('cf-connecting-ip') || 
               req.headers.get('x-real-ip') || 
               'unknown';

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the share info to verify it requires NDA
    const { data: share, error: shareError } = await supabase
      .from('company_sharing')
      .select('id, requires_nda, nda_document_id, nda_accepted_at')
      .eq('id', shareId)
      .single();

    if (shareError || !share) {
      return new Response(
        JSON.stringify({ error: 'Share not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (!share.requires_nda) {
      return new Response(
        JSON.stringify({ error: 'This share does not require NDA' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (share.nda_accepted_at) {
      return new Response(
        JSON.stringify({ error: 'NDA already accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Begin transaction-like operation
    const acceptedAt = new Date().toISOString();

    // Update the share with acceptance info
    const { error: updateError } = await supabase
      .from('company_sharing')
      .update({
        nda_accepted_at: acceptedAt,
        nda_accepted_by_name: signerInfo.name,
        nda_accepted_by_email: signerInfo.email,
        nda_accepted_by_company: signerInfo.company || null,
        nda_accepted_by_title: signerInfo.title || null,
        nda_accepted_by_ip: ip
      })
      .eq('id', shareId);

    if (updateError) {
      throw updateError;
    }

    // Create acceptance log record
    const { error: logError } = await supabase
      .from('nda_acceptances')
      .insert({
        share_id: shareId,
        nda_document_id: share.nda_document_id,
        accepted_by_name: signerInfo.name,
        accepted_by_email: signerInfo.email,
        accepted_by_company: signerInfo.company || null,
        accepted_by_title: signerInfo.title || null,
        accepted_by_ip: ip,
        user_agent: userAgent,
        accepted_at: acceptedAt
      });

    if (logError) {
      // Try to rollback the update (best effort)
      await supabase
        .from('company_sharing')
        .update({
          nda_accepted_at: null,
          nda_accepted_by_name: null,
          nda_accepted_by_email: null,
          nda_accepted_by_company: null,
          nda_accepted_by_title: null,
          nda_accepted_by_ip: null
        })
        .eq('id', shareId);
      
      throw logError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        acceptedAt,
        message: 'NDA accepted successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in accept-nda function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});