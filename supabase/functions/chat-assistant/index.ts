
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface CompanyData {
  id?: string;
  name?: string;
  business_id?: string;
  industry?: string;
  founded?: string;
  employees?: string;
  description?: string;
  website?: string;
  company_type?: string;
  ownership_change_type?: string;
  valuation?: string | number;
  [key: string]: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }
    
    // Parse request body
    const requestData = await req.json();
    const { message, companyName, companyData, messageHistory, fileContent, fileName, userId, context } = requestData;
    
    // Message is not required anymore - this allows handling empty messages or just file uploads
    
    // Get company data from the request if provided, or use defaults - with safety checks
    const userCompanyName = typeof companyName === 'string' ? companyName : "Unknown";
    
    // Safely process company data
    let companyContext = `Company name: ${userCompanyName}`;
    
    if (companyData && typeof companyData === 'object') {
      try {
        // Create a safe copy of company data as a completely new object
        const safeCompanyData: CompanyData = {};
        
        // Safely extract only string properties to prevent circular references
        const allowedFields = [
          'industry', 'founded', 'employees', 'revenue', 'description', 
          'customers', 'competitors', 'technologies', 'business_id', 
          'website', 'company_type', 'ownership_change_type', 'valuation'
        ];
        
        // Only copy the allowed fields that exist and are strings or primitives
        for (const field of allowedFields) {
          if (companyData[field] !== undefined && companyData[field] !== null) {
            try {
              // Convert to string if needed and limit length
              const value = String(companyData[field]).substring(0, 1000);
              safeCompanyData[field] = value;
            } catch (e) {
              console.error(`Error processing field ${field}:`, e);
              // Skip this field if it causes an error
            }
          }
        }
        
        // Now build the context using the safe data
        if (safeCompanyData.industry) companyContext += `\nIndustry: ${safeCompanyData.industry}`;
        if (safeCompanyData.founded) companyContext += `\nFounded: ${safeCompanyData.founded}`;
        if (safeCompanyData.employees) companyContext += `\nEmployees: ${safeCompanyData.employees}`;
        if (safeCompanyData.revenue) companyContext += `\nRevenue: ${safeCompanyData.revenue}`;
        if (safeCompanyData.description) companyContext += `\nDescription: ${safeCompanyData.description}`;
        if (safeCompanyData.customers) companyContext += `\nKey customers: ${safeCompanyData.customers}`;
        if (safeCompanyData.competitors) companyContext += `\nKey competitors: ${safeCompanyData.competitors}`;
        if (safeCompanyData.technologies) companyContext += `\nTechnologies: ${safeCompanyData.technologies}`;
        if (safeCompanyData.business_id) companyContext += `\nBusiness ID: ${safeCompanyData.business_id}`;
        if (safeCompanyData.website) companyContext += `\nWebsite: ${safeCompanyData.website}`;
        if (safeCompanyData.company_type) companyContext += `\nCompany type: ${safeCompanyData.company_type}`;
        if (safeCompanyData.ownership_change_type) companyContext += `\nOwnership change type: ${safeCompanyData.ownership_change_type}`;
        if (safeCompanyData.valuation) companyContext += `\nValuation: ${safeCompanyData.valuation}`;
      } catch (error) {
        console.error("Error processing company data:", error);
        companyContext += "\nError: Could not process company data completely.";
      }
    }
    
    // Add file content to context if provided - with validation
    let fileContext = "";
    if (fileContent && fileName && typeof fileContent === 'string' && typeof fileName === 'string') {
      // Validate file content to prevent potential issues
      const safeFileContent = fileContent.substring(0, 10000); // Limit size to prevent issues
      fileContext = `\n\nThe user has uploaded a file named "${fileName}" with the following content:\n${safeFileContent}`;
    }
    
    // Add task context if provided - with validation
    let taskContext = "";
    if (context && typeof context === 'object' && context.taskId && context.taskTitle) {
      taskContext = `\n\nThe user is working on a task: "${context.taskTitle}" (ID: ${context.taskId})`;
    }
    
    // Build conversation history
    const messages: Message[] = [
      {
        role: 'assistant',
        content: `You are an AI assistant specialized in helping business owners prepare their companies for sale. You provide advice on improving company valuation, documentation requirements, and the overall sales process. You are helpful, articulate, and you communicate in Finnish.
        
        Company context:
        ${companyContext}
        ${fileContext}
        ${taskContext}
        
        Focus areas for company sales readiness:
        1. Documentation - All contracts, processes, IP rights should be well documented
        2. Business Processes - Clear, repeatable processes increase company value
        3. Financial Health - Stable finances with predictable revenue are attractive
        4. Customer Base - Diverse customer base reduces risk
        5. Growth Trajectory - Companies showing growth command higher valuations
        6. Due Diligence Preparedness - Help the owner prepare for buyer's due diligence process
        7. Identify Potential Buyers - Help think about who might be interested in buying and why
        8. Silent Information - Help document tacit knowledge that could be lost if the owner leaves
        
        Maintain professionalism at all times. If you encounter content that could be inappropriate or offensive, politely guide the conversation back to business topics.
        
        For user questions about their company, use the company context provided above. If asked about the company and no specific information is available, you can acknowledge that and suggest the user might want to add more details about their company in their profile.`
      }
    ];
    
    // Add message history if provided, with validation
    if (messageHistory && Array.isArray(messageHistory)) {
      try {
        // Filter out any invalid messages to prevent issues
        const validMessages = messageHistory.filter(msg => 
          msg && typeof msg === 'object' && 
          (msg.role === 'user' || msg.role === 'assistant') && 
          typeof msg.content === 'string'
        );
        
        // Limit the number of messages to prevent stack overflow
        const limitedMessages = validMessages.slice(-20); // Only take the last 20 messages
        
        messages.push(...limitedMessages);
      } catch (error) {
        console.error("Error processing message history:", error);
        // Continue without message history if there's an error
      }
    }
    
    // Add current message - with validation
    if (typeof message === 'string') {
      messages.push({
        role: 'user',
        content: message
      });
    } else {
      // If no message is provided, we'll use a default prompt to process any attached files
      // or respond to empty messages
      messages.push({
        role: 'user',
        content: fileContent ? 'Analyze this file for me.' : 'Hi'
      });
    }
    
    // Log safely without full message content to avoid circular reference issues
    console.log("Sending request to OpenAI with message count:", messages.length);
    
    // Get text response from OpenAI
    const textResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    if (!textResponse.ok) {
      const errorData = await textResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`Failed to get response from OpenAI: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const textData = await textResponse.json();
    const responseText = textData.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
    
    // Try to get audio response from OpenAI, but don't block if it fails
    let base64Audio = null;
    try {
      const audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          voice: "nova", // Use a more natural voice
          input: responseText,
          response_format: "mp3"
        }),
      });
      
      if (audioResponse.ok) {
        // Convert audio to base64
        const arrayBuffer = await audioResponse.arrayBuffer();
        base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      } else {
        console.warn("Failed to generate speech, continuing without audio");
      }
    } catch (audioError) {
      console.error("Error generating audio:", audioError);
      // Continue without audio
    }
    
    return new Response(
      JSON.stringify({
        response: responseText,
        audioContent: base64Audio
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error("Error in chat-assistant function:", error);
    
    // Return a graceful error response
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "Pahoittelut, tekoälyassistentin käytössä ilmeni tekninen ongelma. Yritäthän hetken kuluttua uudelleen."
      }),
      {
        status: 200, // Always return 200 status code even for errors to prevent client errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
