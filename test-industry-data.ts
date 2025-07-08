// Test script to debug industry data fetching issue
// This will help us understand why industry data is only 274 characters

const CLAUDE_API_KEY = Deno.env.get("CLAUDE_API_KEY");
if (!CLAUDE_API_KEY) {
  console.error("CLAUDE_API_KEY not configured");
  Deno.exit(1);
}

const companyName = "Verkkokauppa.com"; // Example company

const searchPrompt = `Hae yrityksen ${companyName} toimialaa koskevat keskeiset tunnusluvut ja vertailutiedot. 

Etsi seuraavat tiedot:
1. Toimialan keskimääräiset EBITDA-marginaalit
2. Toimialan tyypilliset kasvuluvut 
3. Toimialan WACC-arviot ja pääomakustannukset
4. Toimialan keskimääräiset CAPEX-tasot suhteessa liikevaihtoon
5. Toimialan näkymät ja trendit 2024-2025
6. Vertailukelpoisia yrityksiä samalta toimialalta

Käytä web-hakua löytääksesi tuoreimmat ja relevantit tiedot. Anna kattava vastaus perustuen hakutuloksiin.`;

console.log("Testing Claude API with web_search for industry data...");
console.log("Company:", companyName);
console.log("---");

try {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.4,
      tools: [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 6
      }],
      messages: [{ 
        role: 'user', 
        content: searchPrompt 
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("API Error:", errorData);
    Deno.exit(1);
  }

  const data = await response.json();
  
  console.log("Full response structure:");
  console.log(JSON.stringify(data, null, 2));
  
  console.log("\n---\nContent blocks analysis:");
  if (data.content && Array.isArray(data.content)) {
    data.content.forEach((block, index) => {
      console.log(`\nBlock ${index}:`);
      console.log("- Type:", block.type);
      if (block.type === 'text') {
        console.log("- Length:", block.text.length, "characters");
        console.log("- Preview:", block.text.substring(0, 200) + "...");
      } else if (block.type === 'tool_use') {
        console.log("- Tool:", block.name);
        console.log("- Input:", JSON.stringify(block.input, null, 2));
      }
    });
  }
  
  // Current code logic (finding LAST text)
  let lastTextContent = '';
  if (data.content && Array.isArray(data.content)) {
    for (let i = data.content.length - 1; i >= 0; i--) {
      if (data.content[i].type === 'text') {
        lastTextContent = data.content[i].text;
        break;
      }
    }
  }
  
  console.log("\n---\nCurrent code would extract:");
  console.log("Length:", lastTextContent.length, "characters");
  console.log("Content:", lastTextContent);
  
  // Better approach: concatenate ALL text blocks
  let allTextContent = '';
  if (data.content && Array.isArray(data.content)) {
    for (const block of data.content) {
      if (block.type === 'text') {
        allTextContent += block.text + '\n\n';
      }
    }
  }
  
  console.log("\n---\nAll text blocks concatenated:");
  console.log("Total length:", allTextContent.trim().length, "characters");
  console.log("Content preview:", allTextContent.trim().substring(0, 500) + "...");
  
} catch (error) {
  console.error("Error:", error);
}