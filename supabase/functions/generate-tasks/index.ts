// supabase/functions/generate-tasks/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { generateExitSuggestion } from "./suggestions.ts";
import { regenerateExitSuggestionWithUserChoices } from "./regenerateSuggestion.ts";
import { generateTasks, saveTasks } from "./tasks.ts";
import { TaskRequest, TaskGenerationResponse } from "./types.ts";

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

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY ympäristömuuttuja puuttuu");
    }

    // Supabase config
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase-asetuksia ei ole määritetty");
    }

    const requestData: TaskRequest = await req.json();
    const { companyId, assessmentId, valuationId, exitType, timeline, generateSuggestionsOnly, regenerateSuggestion } = requestData;

    if (!companyId || !assessmentId || !valuationId) {
      throw new Error("Pakolliset parametrit puuttuvat: companyId, assessmentId, valuationId");
    }

    console.log(`Käsitellään pyyntöä: ${JSON.stringify({
      companyId,
      assessmentId,
      valuationId,
      exitType,
      timeline,
      generateSuggestionsOnly,
      regenerateSuggestion
    })}`);

    let response: TaskGenerationResponse;

    // Tarkista käyttäjän JWT token ja hae käyttäjän ID
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Kirjautuminen vaaditaan");
    }

    // JWT-token tulee muodossa "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    // Dekoodaa JWT:n payload-osa (keskimmäinen osa)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error("Virheellinen JWT-token");
    }

    let decodedPayload;
    try {
      // Dekoodaa base64-koodattu payload
      const base64Payload = tokenParts[1];
      const payload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
      decodedPayload = JSON.parse(payload);
    } catch (error) {
      throw new Error("JWT-tokenin dekoodaus epäonnistui");
    }

    // Hae käyttäjän ID JWT:stä
    const userId = decodedPayload.sub;

    if (!userId) {
      throw new Error("Käyttäjän tunnistus epäonnistui");
    }

    console.log(`Käyttäjä tunnistettu: ${userId}`);

    // Step 1a: Generate initial exit suggestions if needed
    if (generateSuggestionsOnly === true) {
      console.log("Generoidaan ehdotuksia omistajanvaihdostyypistä ja aikataulusta");

      const suggestionResponse = await generateExitSuggestion(
        companyId,
        assessmentId,
        valuationId,
        userId,
        token
      );

      response = {
        success: true,
        message: "Ehdotukset generoitu onnistuneesti",
        suggestion: suggestionResponse.suggestion,
        suggestedIssues: suggestionResponse.suggestedIssues
      };

      // If only suggestions were requested, return them now
      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 1b: Handle regeneration of suggestions based on user choices
    if (regenerateSuggestion === true) {
      if (!exitType || !timeline) {
        throw new Error("Exit-tyyppi ja aikataulu vaaditaan ehdotusten päivittämiseen");
      }

      console.log("Päivitetään ehdotuksia käyttäjän valintojen perusteella");

      const suggestionResponse = await regenerateExitSuggestionWithUserChoices(
        companyId,
        assessmentId,
        valuationId,
        exitType,
        timeline,
        userId,
        token
      );

      response = {
        success: true,
        message: "Ehdotukset päivitetty käyttäjän valintojen perusteella",
        suggestion: suggestionResponse.suggestion,
        suggestedIssues: suggestionResponse.suggestedIssues
      };

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Generate or regenerate initial suggestions if not provided
    if (!exitType || !timeline) {
      console.log("Generoidaan automaattisesti ehdotuksia omistajanvaihdostyypistä ja aikataulusta");

      const suggestionResponse = await generateExitSuggestion(
        companyId,
        assessmentId,
        valuationId,
        userId,
        token
      );

      response = {
        success: true,
        message: "Ehdotukset generoitu onnistuneesti",
        suggestion: suggestionResponse.suggestion,
        suggestedIssues: suggestionResponse.suggestedIssues
      };
    }

    // Step 3: Generate tasks using the provided or suggested exit type and timeline
    const finalExitType = exitType || response?.suggestion?.exitType;
    const finalTimeline = timeline || response?.suggestion?.timeline;
    const suggestedIssues = response?.suggestedIssues || [];

    if (!finalExitType || !finalTimeline) {
      throw new Error("Omistajanvaihdostyyppi tai aikataulu puuttuu eikä niitä voitu generoida automaattisesti");
    }

    console.log(`Generoidaan tehtäviä parametreillä:
      exitType: ${finalExitType}
      timeline: ${finalTimeline}
      issues: ${suggestedIssues.length} kpl
    `);

    // Generate tasks with JWT token
    const tasks = await generateTasks(
      companyId,
      assessmentId,
      valuationId,
      finalExitType,
      finalTimeline,
      suggestedIssues,
      userId,
      token
    );

    // Save tasks to database with JWT token
    await saveTasks(
      token,
      SUPABASE_URL,
      companyId,
      assessmentId,
      valuationId,
      tasks,
      userId
    );

    response = {
      success: true,
      message: "Tehtävät generoitu onnistuneesti",
      taskCount: tasks.length,
      suggestion: response?.suggestion,
      suggestedIssues: response?.suggestedIssues
    };

    console.log("Tehtävät generoitu ja tallennettu onnistuneesti");

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Virhe tehtävien generoinnissa:", error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Tuntematon virhe" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});