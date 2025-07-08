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
      try {
        // Haetaan kaikki kommentit ja liitetyt profiilit yhtenä pyyntönä
        const { data: commentsData, error: commentsError } = await supabaseAdmin
          .from('share_comments')
          .select(`
            *,
            profiles:user_id (
              full_name,
              email
            )
          `)
          .eq('share_id', shareId)
          .order('created_at', { ascending: true });
        if (!commentsError) {
          // Muokataan kommentit sisältämään käyttäjän tiedot sopivassa muodossa
          comments = (commentsData || []).map(comment => ({
            ...comment,
            user_name: comment.profiles?.full_name || null,
            user_email: comment.profiles?.email || null,
            // Merkitse onko kommentin lähettänyt jaon omistaja
            is_owner: comment.user_id === share.shared_by
          }));
        } else {
          console.error("Error fetching comments:", commentsError);
        }
      } catch (error) {
        console.error("Error processing comments:", error);
      }
    }

    // Fetch tasks if available and shared
    let tasks = null;
    let valuationImpact = null;

    if (share.share_tasks) {
      try {
        // Haetaan valitut tehtävät, jos shared_tasks-kentässä on määritetty
        if (share.shared_tasks && Array.isArray(share.shared_tasks) && share.shared_tasks.length > 0) {
          console.log("Haetaan valitut tehtävät:", share.shared_tasks);

          const { data: tasksData, error: tasksError } = await supabaseAdmin
            .from('company_tasks')
            .select(`
              *,
              task_responses(*)
            `)
            .in('id', share.shared_tasks)
            .order('category', { ascending: true })
            .order('priority', { ascending: false });

          if (!tasksError && tasksData && tasksData.length > 0) {
            console.log(`Löydettiin ${tasksData.length} jaettua tehtävää`);
            tasks = tasksData;
          } else {
            console.error("Error fetching selected tasks:", tasksError);
          }
        } else {
          // Vanha logiikka: haetaan kaikki valmiit tehtävät jos ei ole määritelty tiettyjä tehtäviä
          console.log("Haetaan kaikki valmiit tehtävät, koska shared_tasks ei ole määritetty");
          const { data: tasksData, error: tasksError } = await supabaseAdmin
            .from('company_tasks')
            .select(`
              *,
              task_responses(*)
            `)
            .eq('company_id', share.company_id)
            .eq('completion_status', 'completed')
            .order('created_at', { ascending: false });

          if (!tasksError && tasksData) {
            console.log(`Löydettiin ${tasksData.length} valmista tehtävää`);
            tasks = tasksData;
          } else {
            console.error("Error fetching completed tasks:", tasksError);
          }
        }
      } catch (taskError) {
        console.error("Error processing tasks:", taskError);
      }
    }

    // Fetch valuation impact if available and shared
    if (share.share_valuation_impact) {
      try {
        // Hae viimeisin valmis valuation impact analysis
        const { data: impactData, error: impactError } = await supabaseAdmin
          .from('valuation_impact_analysis')
          .select('*')
          .eq('company_id', share.company_id)
          .eq('status', 'completed')
          .order('calculation_date', { ascending: false })
          .limit(1)
          .single();

        if (!impactError && impactData) {
          console.log(`Löydettiin valuation impact analysis: ${impactData.id}`);
          valuationImpact = impactData;
        } else {
          console.log("Ei löytynyt valmista valuation impact analysisia:", impactError);
        }
      } catch (error) {
        console.error("Virhe valuation impact analyysin haussa:", error);
      }
    }

    // Dokumenttien haku
    let documents = [];
    if (share.share_documents && share.shared_documents) {
      try {
        // Hae dokumentit shared_documents-kentästä
        const sharedDocuments = Array.isArray(share.shared_documents) 
          ? share.shared_documents 
          : [];

        console.log("Jaettavia dokumentteja:", sharedDocuments.length);

        for (const doc of sharedDocuments) {
          if (!doc.id || !doc.source) {
            console.log("Ohitetaan dokumentti, koska id tai source puuttuu:", doc);
            continue;
          }

          // Yrityksen dokumentit (company_documents)
          if (doc.source === 'company_documents') {
            const { data, error } = await supabaseAdmin
              .from('company_documents')
              .select('*')
              .eq('id', doc.id)
              .single();

            if (error) {
              console.error(`Virhe haettaessa dokumenttia ${doc.id}:`, error);
              continue;
            }

            if (!data || !data.file_path) {
              console.log(`Dokumenttia ${doc.id} ei löytynyt tai tiedostopolku puuttuu`);
              continue;
            }

            // Luodaan dokumentti-objekti
            const documentEntry = {
              id: data.id,
              name: data.name,
              description: data.description,
              type: data.document_type,
              created_at: data.created_at,
              file_path: data.file_path,
              source: 'company_documents'
            };

            // Luo väliaikainen URL company-files bucketista
            try {
              // **TÄRKEÄ: Käytä tarkkaa bucket-nimeä ja oikeaa tiedostopolkua**
              const bucketName = 'company-files';
              const filePath = data.file_path; // Käytä tiedostopolkua sellaisenaan!

              console.log(`Creating signed URL from bucket "${bucketName}" with path "${filePath}"`);

              const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
                .from(bucketName)
                .createSignedUrl(filePath, 60 * 60 * 24); // 24 tuntia

              if (signedUrlError) {
                console.error("Error creating signed URL:", signedUrlError);
                // Yritetään myös julkista URL:ää varalta
                const { data: publicUrlData } = supabaseAdmin.storage
                  .from(bucketName)
                  .getPublicUrl(filePath);

                if (publicUrlData?.publicUrl) {
                  documentEntry.publicUrl = publicUrlData.publicUrl;
                  console.log("Created public URL instead:", publicUrlData.publicUrl);
                }
              } else if (signedUrlData) {
                documentEntry.signedUrl = signedUrlData.signedUrl;
                console.log("Signed URL created successfully");
              }
            } catch (urlError) {
              console.error("Exception during URL creation:", urlError);
            }

            documents.push(documentEntry);
          } 
          // Tehtävien liitetiedostot (task_responses)
          else if (doc.source === 'task_responses') {
            const { data, error } = await supabaseAdmin
              .from('task_responses')
              .select('*, company_tasks(title)')
              .eq('id', doc.id)
              .single();

            if (error) {
              console.error(`Virhe haettaessa tehtävävastausta ${doc.id}:`, error);
              continue;
            }

            if (!data || !data.file_path) {
              console.log(`Tehtävävastausta ${doc.id} ei löytynyt tai tiedostopolku puuttuu`);
              continue;
            }

            // Luodaan dokumentti-objekti 
            const documentEntry = {
              id: data.id,
              name: data.file_name || 'Tehtävän liite',
              description: `Liittyy tehtävään: ${data.company_tasks?.title || 'Ei tietoa'}`,
              type: 'task_attachment',
              created_at: data.created_at,
              file_path: data.file_path,
              source: 'task_responses'
            };

            // Luo väliaikainen URL task-files bucketista
            try {
              // **TÄRKEÄ: Käytä tarkkaa bucket-nimeä ja oikeaa tiedostopolkua**
              const bucketName = 'task-files';
              const filePath = data.file_path; // Käytä tiedostopolkua sellaisenaan!

              console.log(`Creating signed URL from bucket "${bucketName}" with path "${filePath}"`);

              const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
                .from(bucketName)
                .createSignedUrl(filePath, 60 * 60 * 24); // 24 tuntia

              if (signedUrlError) {
                console.error("Error creating signed URL:", signedUrlError);
                // Yritetään myös julkista URL:ää varalta
                const { data: publicUrlData } = supabaseAdmin.storage
                  .from(bucketName)
                  .getPublicUrl(filePath);

                if (publicUrlData?.publicUrl) {
                  documentEntry.publicUrl = publicUrlData.publicUrl;
                  console.log("Created public URL instead:", publicUrlData.publicUrl);
                }
              } else if (signedUrlData) {
                documentEntry.signedUrl = signedUrlData.signedUrl;
                console.log("Signed URL created successfully");
              }
            } catch (urlError) {
              console.error("Exception during URL creation:", urlError);
            }

            documents.push(documentEntry);
          }
        }

        console.log(`Käsitelty ${documents.length} jaettavaa dokumenttia`);
      } catch (docError) {
        console.error("Virhe dokumenttien hakemisessa:", docError);
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
      company: {
        id: company.id,
        name: company.name,
        business_id: company.business_id,
        industry: company.industry,
        description: company.description,
        founded: company.founded,
        employees: company.employees,
        website: company.website,
        company_type: company.company_type
      },
      assessment: assessment,
      valuation: valuation,
      documents: share.share_documents ? {
        available: documents.length > 0,
        documents: documents
      } : null,
      comments: comments,
      tasks: tasks,
      valuationImpact: valuationImpact
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