
// Import any dependencies needed for your implementation
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.23.0";

/**
 * Formats and processes the raw response from the Gemini AI model
 * @param response The raw response from the Gemini AI model
 * @returns The formatted and processed response
 */
export function formatGeminiResponse(response: any) {
  console.log("Processing Gemini response...");
  
  try {
    // If response is already a string, try to parse it as JSON
    if (typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch (error) {
        console.error("Failed to parse Gemini response as JSON:", error);
        return response;
      }
    }
    
    // If response has a text property (common in Gemini responses)
    if (response.text) {
      try {
        return JSON.parse(response.text);
      } catch (error) {
        console.error("Failed to parse response.text as JSON:", error);
        return response.text;
      }
    }
    
    // If response comes from a content object in the response
    if (response.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const textContent = response.response.candidates[0].content.parts[0].text;
      try {
        return JSON.parse(textContent);
      } catch (error) {
        console.error("Failed to parse response content as JSON:", error);
        return textContent;
      }
    }
    
    // If the result is already a parsed object
    if (response.company || response.documents) {
      return response;
    }
    
    console.log("Returning unmodified response as fallback");
    return response;
  } catch (error) {
    console.error("Error in formatGeminiResponse:", error);
    return response; // Return original response as fallback
  }
}
