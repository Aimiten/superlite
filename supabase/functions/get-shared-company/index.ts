
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.29.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase-asetuksia ei ole määritetty");
    }
    
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { shareId } = await req.json();
    
    if (!shareId) {
      throw new Error("Jaon tunniste puuttuu");
    }
    
    console.log(`Haetaan jaettua yritystä tunnuksella: ${shareId}`);
    
    // Fetch share
    const { data: share, error: shareError } = await supabaseAdmin
      .from('company_sharing')
      .select('*')
      .eq('id', shareId)
      .eq('is_active', true)
      .single();
      
    if (shareError) {
      throw new Error(`Jakoa ei löydy: ${shareError.message}`);
    }
    
    if (!share) {
      throw new Error("Jakoa ei löydy tai se on poistettu käytöstä");
    }
    
    // Check expiration date
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new Error("Tämä jakolinkki on vanhentunut");
    }
    
    // Fetch company information
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', share.company_id)
      .single();
      
    if (companyError) {
      throw new Error(`Yritystä ei löydy: ${companyError.message}`);
    }
    
    // Fetch assessment if available and shared
    let assessment = null;
    if (share.share_basic_info && share.assessment_id) {
      const { data: assessmentData, error: assessmentError } = await supabaseAdmin
        .from('assessments')
        .select('*')
        .eq('id', share.assessment_id)
        .single();
        
      if (!assessmentError && assessmentData) {
        assessment = assessmentData;
      }
    }
    
    // Fetch valuation if available and shared
    let valuation = null;
    if (share.share_financial_info && share.valuation_id) {
      const { data: valuationData, error: valuationError } = await supabaseAdmin
        .from('valuations')
        .select('*')
        .eq('id', share.valuation_id)
        .single();
        
      if (!valuationError && valuationData) {
        valuation = valuationData;
      }
    }
    
    // Fetch comments if access level is not "read_only"
    let comments = [];
    if (share.access_level !== 'read_only') {
      const { data: commentsData, error: commentsError } = await supabaseAdmin
        .from('share_comments')
        .select('*')
        .eq('share_id', shareId)
        .order('created_at', { ascending: true });
        
      if (!commentsError) {
        comments = commentsData || [];
      }
    }
    
    // Update viewing information
    await supabaseAdmin
      .from('company_sharing')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', shareId);
      
    // Create view log entry
    await supabaseAdmin
      .from('share_view_logs')
      .insert({
        share_id: shareId,
        viewer_ip: req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '',
        viewer_email: null
      });
    
    // Return data based on access level
    const sharedData = {
      share: {
        id: share.id,
        access_level: share.access_level,
        created_at: share.created_at,
        expires_at: share.expires_at
      },
      company: share.share_basic_info ? {
        id: company.id,
        name: company.name,
        business_id: company.business_id,
        industry: company.industry,
        description: company.description,
        founded: company.founded,
        employees: company.employees,
        website: company.website
      } : {
        id: company.id,
        name: company.name
      },
      assessment: assessment,
      valuation: valuation,
      documents: share.share_documents ? {
        available: false,
        documents: []
      } : null,
      comments: comments
    };
    
    return new Response(
      JSON.stringify({ success: true, data: sharedData }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error("Virhe jaettujen tietojen hakemisessa:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Tuntematon virhe"
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
