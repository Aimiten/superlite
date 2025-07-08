// supabase/functions/generate-dd-tasks/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DDRiskAnalysis } from "../_shared/types.ts";
import { fetchCompanyData } from "../analyze-sales-readiness/data/data-service.ts";
import { createDDTasksPrompt } from "./create-dd-tasks-prompt.ts";
import { validateAndSanitizeTask, validateRequiredFields } from "../generate-tasks/taskValidation.ts";

// Käytä gemini-2.5-flash-preview mallia
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. PYYNNÖN TARKISTUS - lisää funktion alkuun
  console.log("[generate-dd-tasks] Request headers:", {
    contentType: req.headers.get('content-type'),
    authorization: req.headers.has('authorization') ? "Present" : "Missing",
    origin: req.headers.get('origin')
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
      throw new Error("Missing environment variables (Supabase/Gemini)");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const requestData = await req.json();
    const { companyId, ddRiskAnalysis } = requestData;

    if (!companyId || !ddRiskAnalysis) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Puuttuvat parametrit: companyId tai ddRiskAnalysis" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[generate-dd-tasks] Function started for company: ${companyId}`);

    // Hae yrityksen kattavat tiedot
    const companyData = await fetchCompanyData(supabase, companyId);
    console.log(`[generate-dd-tasks] Fetched comprehensive company data with ${companyData.documents?.length || 0} documents`);

    // Hae valuation impact analyysi
    const { data: impactData, error: impactError } = await supabase
      .from('valuation_impact_analysis')
      .select('*')
      .eq('company_id', companyId)
      .order('calculation_date', { ascending: false })
      .limit(1)
      .single();

    if (impactError && impactError.code !== 'PGRST116') {
      console.warn(`[generate-dd-tasks] Warning: Could not fetch valuation impact: ${impactError.message}`);
    } else if (impactData) {
      console.log(`[generate-dd-tasks] Found valuation impact analysis from ${impactData.calculation_date}`);
    }

    // 1. Lokita DD-riskianalyysi
    console.log("[generate-dd-tasks] DD Risk Analysis categories:", 
      ddRiskAnalysis.riskiKategoriat.map(k => `${k.kategoria} (taso: ${k.riskitaso})`));
    console.log("[generate-dd-tasks] DD Risk Analysis overall level:", ddRiskAnalysis.kokonaisRiskitaso);

    // 2. Lokita olemassa olevat tehtävät yksityiskohtaisesti
    console.log("[generate-dd-tasks] Existing tasks:", companyData.tasks.map(t => ({
      id: t.id,
      title: t.title, 
      category: t.category,
      completion_status: t.completion_status,
      has_response: t.task_responses?.length > 0 || (t.value && Object.keys(t.value).length > 0)
    })));

    // 3. Lokita assessmentData tiedot
    console.log("[generate-dd-tasks] Assessment data available:", 
      companyData.assessmentData ? `Yes, from ${companyData.assessmentData.created_at}` : "No");
    if (companyData.assessmentData?.results) {
      console.log("[generate-dd-tasks] Assessment results keys:", 
        typeof companyData.assessmentData.results === 'object' 
          ? Object.keys(companyData.assessmentData.results)
          : "Results as string");
    }

    // 4. Lokita valuaation tiedot
    console.log("[generate-dd-tasks] Valuation data available:", 
      companyData.valuationData ? `Yes, from ${companyData.valuationData.created_at}` : "No");

    // 5. Lokita impactData tiedot KATTAVASTI
    if (impactData) {
      console.log("[generate-dd-tasks] Impact Analysis available:", 
        `Yes, from ${impactData.calculation_date}`);

      // Lokita impact-taulun keskeiset rakenteet
      console.log("[generate-dd-tasks] Impact Analysis original_valuation_snapshot:", 
        impactData.original_valuation_snapshot ? 
          `Available (keys: ${Object.keys(impactData.original_valuation_snapshot).join(', ')})` : 
          "Not available");

      console.log("[generate-dd-tasks] Impact Analysis adjusted_valuation_result:", 
        impactData.adjusted_valuation_result ? 
          `Available (keys: ${Object.keys(impactData.adjusted_valuation_result).join(', ')})` : 
          "Not available");

      console.log("[generate-dd-tasks] Impact Analysis adjustment_factors:", 
        impactData.adjustment_factors ? 
          `Available (keys: ${Object.keys(impactData.adjustment_factors).join(', ')})` : 
          "Not available");

      console.log("[generate-dd-tasks] Impact Analysis sales_readiness_analysis:", 
        impactData.sales_readiness_analysis ? 
          `Available with ${Object.keys(impactData.sales_readiness_analysis).length} keys` : 
          "Not available");

      // Jos dd_risk_analysis on saatavilla impact-taulussa, tarkistetaan sen sisältö
      console.log("[generate-dd-tasks] Impact Analysis dd_risk_analysis:", 
        impactData.dd_risk_analysis ? 
          `Available (categories: ${impactData.dd_risk_analysis.riskiKategoriat?.length || 'N/A'})` : 
          "Not available");
    } else {
      console.log("[generate-dd-tasks] Impact Analysis: Not available");
    }

    // 6. Lokita dokumenttien tiedot
    console.log("[generate-dd-tasks] Documents:", companyData.documents?.map(d => ({
      name: d.name,
      type: d.document_type || d.file_type,
      has_content: !!d.content,
      has_base64: !!d.base64
    })));

    // 7. Lokita companyInfo tiedot
    console.log("[generate-dd-tasks] Company Info available:", 
      companyData.companyInfo ? "Yes" : "No");
    if (companyData.companyInfo) {
      console.log("[generate-dd-tasks] Company Info SWOT:", {
        strengths: !!companyData.companyInfo.strengths,
        weaknesses: !!companyData.companyInfo.weaknesses,
        opportunities: !!companyData.companyInfo.opportunities,
        threats: !!companyData.companyInfo.threats
      });
    }

    // Luo prompt
    const prompt = createDDTasksPrompt({
      ddRiskAnalysis, 
      companyData: companyData.companyData,
      companyInfo: companyData.companyInfo,
      tasks: companyData.tasks || [],
      assessmentData: companyData.assessmentData,
      valuationData: companyData.valuationData,
      impactData: impactData || null,
      documents: companyData.documents || []
    });

    // 8. Lokita koko prompt (tai osa siitä)
    console.log("[generate-dd-tasks] Prompt first 1000 chars:", prompt.substring(0, 1000) + "...");
    console.log("[generate-dd-tasks] Prompt length:", prompt.length);
    console.log("[generate-dd-tasks] Prompt EXISTING TASKS section:", 
      prompt.indexOf("# SUORITETUT TEHTÄVÄT") > -1
        ? prompt.substring(
            prompt.indexOf("# SUORITETUT TEHTÄVÄT"), 
            prompt.indexOf("# OHJEITA TEHTÄVIEN LUOMISEEN")
          )
        : "Section not found in prompt");

    // Käytä suoraa API-kutsua halutulla mallilla
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 32768, // Korkeampi token-raja
        responseMimeType: "application/json",
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });

    // Suorita API-kutsu
    console.log(`[generate-dd-tasks] Calling Gemini model (${GEMINI_MODEL}) for task generation`);
    const contents = [{ role: "user", parts: [{ text: prompt }] }];

    // Lisää dokumentit multipart-sisältönä jos PDF-dokumentteja on
    const hasPdfDocuments = companyData.documents?.some(doc => 
      doc.base64 && (doc.mime_type?.includes('pdf') || doc.file_type?.includes('pdf'))
    );

    let result;
    if (hasPdfDocuments) {
      console.log("[generate-dd-tasks] Using multipart content for PDF documents");

      // Luo multipart-sisältö joka sisältää promptin ja dokumentit
      const multipartContents = [{ role: "user", parts: [] }];

      // Lisää prompt ensin
      multipartContents[0].parts.push({ text: prompt });

      // Lisää PDF-dokumentit
      companyData.documents?.forEach((doc, index) => {
        if (doc.base64 && (doc.mime_type?.includes('pdf') || doc.file_type?.includes('pdf'))) {
          // Dokumentin kuvaus
          multipartContents[0].parts.push({
            text: `\n\n--- DOKUMENTTI ${index + 1}: ${doc.name} (${doc.document_type || 'Dokumentti'}) ---\n\n`
          });

          // PDF-sisältö
          multipartContents[0].parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: doc.base64
            }
          });

          console.log(`[generate-dd-tasks] Added PDF document ${index + 1}: ${doc.name}`);
        } else if (doc.content) {
          // Tekstidokumentti
          multipartContents[0].parts.push({
            text: `\n\n--- DOKUMENTTI ${index + 1}: ${doc.name} (${doc.document_type || 'Dokumentti'}) ---\n\n${doc.content}`
          });

          console.log(`[generate-dd-tasks] Added text document ${index + 1}: ${doc.name}`);
        }
      });

      result = await model.generateContent({
        contents: multipartContents,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 32768,
          responseMimeType: "application/json",
        }
      });
    } else {
      // Tavallinen tekstiprompt
      result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 32768,
          responseMimeType: "application/json",
        }
      });
    }

    if (!result.response) {
      throw new Error("Gemini API did not return a response");
    }

    // Paranna JSON-parsintaa
    const responseText = result.response.text();
    let generatedTasks;

    try {
      // Lokita vastaus debuggausta varten (näytä alku ja loppu jos pitkä)
      if (responseText.length > 300) {
        console.log("[generate-dd-tasks] Raw response sample (start):", responseText.substring(0, 150));
        console.log("[generate-dd-tasks] Raw response sample (end):", responseText.substring(responseText.length - 150));
      } else {
        console.log("[generate-dd-tasks] Raw response:", responseText);
      }

      // Etsi JSON-taulukko tekstistä
      const jsonMatch = responseText.match(/\[[\s\S]*\]/s);
      if (jsonMatch) {
        generatedTasks = JSON.parse(jsonMatch[0]);
      } else {
        // Jos täydellinen JSON ei löydy, yritä poimia tehtävät yksitellen
        console.log("[generate-dd-tasks] Full JSON array not found, trying to extract individual tasks");
        const taskMatches = responseText.matchAll(/\{\s*"title"[\s\S]*?(?:"options":\s*\[[^\]]*\]|})\s*(?=,|\])/g);
        const tasks = Array.from(taskMatches).map(match => {
          try {
            const taskStr = match[0];
            // Korjaa puuttuvia sulkeita jos tarpeen
            const fixedTaskStr = taskStr.endsWith('}') ? taskStr : taskStr + '}';
            return JSON.parse(fixedTaskStr);
          } catch (e) {
            console.warn("[generate-dd-tasks] Failed to parse task:", match[0]);
            return null;
          }
        }).filter(Boolean);

        if (tasks.length > 0) {
          generatedTasks = tasks;
          console.log(`[generate-dd-tasks] Extracted ${tasks.length} individual tasks`);
        } else {
          throw new Error("Could not extract any valid task objects from response");
        }
      }

      if (!Array.isArray(generatedTasks)) {
        throw new Error("Generated tasks are not in the expected array format");
      }

      console.log(`[generate-dd-tasks] Successfully parsed ${generatedTasks.length} generated tasks`);
    } catch (parseError) {
      console.error("[generate-dd-tasks] Error parsing task generation response:", parseError);
      console.error("[generate-dd-tasks] Raw response:", responseText);
      throw new Error(`Error parsing task generation response: ${parseError.message}`);
    }

    // Valmistele tehtävät tietokantaan tallennusta varten - LISÄÄ VALIDOINTI
    const taskInserts = generatedTasks.map((task, index) => {
      // Validoi enum-tyyppiset kentät
      const validatedEnums = validateAndSanitizeTask(task, index);

      // Validoi pakolliset tekstikentät
      const validatedRequired = validateRequiredFields(task, index);

      return {
        title: validatedRequired.title,
        description: validatedRequired.description,
        category: validatedEnums.category,
        type: validatedEnums.type,
        priority: validatedEnums.priority,
        impact: validatedEnums.impact,
        estimated_time: task.estimated_time || "",
        expected_outcome: task.expected_outcome || "",
        completion_status: validatedEnums.completion_status,
        company_id: companyId,
        options: validatedEnums.type === 'multiple_choice' ? (task.options || []) : null,
        dependencies: [], 
        dd_related: true
      };
    });

    // Log validation summary
    console.log(`[generate-dd-tasks] Validated ${taskInserts.length} tasks for saving`);

    // Tallenna tehtävät
    const { data: savedTasks, error: insertError } = await supabase
      .from('company_tasks')
      .insert(taskInserts)
      .select();

    if (insertError) {
      console.error(`[generate-dd-tasks] Error inserting tasks: ${insertError.message}`);
      // Lisää debuggausta virhetilanteessa
      console.error(`[generate-dd-tasks] First task data sample:`, JSON.stringify(taskInserts[0], null, 2));
      throw new Error(`Tehtävien tallennus epäonnistui: ${insertError.message}`);
    }

    console.log(`[generate-dd-tasks] Successfully saved ${savedTasks?.length || 0} tasks`);

    // 2. VASTAUKSEN VALMISTELU - suoraan ennen vastauksen palauttamista
    const responseBody = {
      success: true,
      message: `Luotu ${savedTasks?.length || 0} uutta tehtävää DD-riskien korjaamiseksi`,
      taskCount: savedTasks?.length || 0
    };

    console.log("[generate-dd-tasks] Preparing response:", {
      status: 200,
      headers: corsHeaders,
      body: responseBody
    });

    // 3. VASTAUKSEN PALAUTUS
    const response = new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    console.log("[generate-dd-tasks] Response ready to send:", {
      statusText: response.statusText,
      bodyUsed: response.bodyUsed,
      headers: Object.fromEntries([...response.headers.entries()])
    });

    return response;

  } catch (error) {
    // 4. VIRHEKÄSITTELY
    console.error("[generate-dd-tasks] Detailed error:", {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
      stringified: String(error)
    });

    // Varmista oikea status ja muotoilu
    const errorMessage = error instanceof Error ? error.message : "Tuntematon virhe";
    const errorResponse = {
      success: false, 
      message: errorMessage,
      error: errorMessage, // frontendille ystävällinen muotoilu
      timestamp: new Date().toISOString()
    };

    console.log("[generate-dd-tasks] Sending error response:", {
      status: 500,
      body: errorResponse
    });

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});