// Test script for AI manager - can be run locally for testing
// Usage: deno run --allow-env --allow-net test-ai-manager.ts

import { callAIModels } from "./ai-client-manager.ts";

async function testAIManager() {
  console.log("Testing AI Manager with parallel calls...\n");
  
  const testPrompt = `
Olet tekoäly-assistentti. Vastaa lyhyesti JSON-muodossa seuraavaan kysymykseen:
Mikä on Suomen pääkaupunki ja montako asukasta siellä on?

Vastaa tässä muodossa:
{
  "kaupunki": "kaupungin nimi",
  "asukasluku": numero,
  "tiedot_paivitetty": "YYYY-MM-DD"
}
`;

  try {
    console.log("Sending test prompt to AI models...");
    const startTime = Date.now();
    
    const result = await callAIModels({
      prompt: testPrompt,
      documents: [],
      timeout: 30000 // 30 second timeout for test
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`\nResponse received in ${elapsed}ms`);
    
    if (result.response && result.response.structuredJson) {
      console.log("\nStructured JSON response:");
      console.log(JSON.stringify(result.response.structuredJson, null, 2));
    } else if (result.response && result.response.text) {
      console.log("\nText response:");
      console.log(result.response.text());
    } else {
      console.log("\nUnexpected response format:");
      console.log(result);
    }
    
  } catch (error) {
    console.error("\nTest failed:", error);
  }
}

// Run the test
if (import.meta.main) {
  testAIManager();
}