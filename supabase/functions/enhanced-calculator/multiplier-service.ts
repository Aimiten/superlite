// Industry multiplier service using Perplexity
// Reuses logic from simple-calculator but simplified

export async function getIndustryMultipliers(industry: string, apiKey: string): Promise<any> {
  console.log(`Getting multipliers for industry: ${industry}`);

  if (!apiKey) {
    console.warn('No Perplexity API key, using defaults');
    return getDefaultMultipliers();
  }

  try {
    const prompt = `
      Etsi toimialalle "${industry}" sopivat arvostuskertoimet suomalaisille PK-yrityksille.
      
      Käytä luotettavia lähteitä kuten:
      - Business Valuation Resources
      - Finnvera tilastot
      - Toimialaraportit
      
      Anna JSON-muodossa:
      {
        "revenue": {
          "min": numero,
          "avg": numero, 
          "max": numero,
          "justification": "Lyhyt perustelu",
          "source": "Lähde"
        },
        "evEbit": {
          "min": numero,
          "avg": numero,
          "max": numero,
          "justification": "Lyhyt perustelu", 
          "source": "Lähde"
        }
      }`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a business valuation expert. Always respond in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const multipliers = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!multipliers.revenue || !multipliers.evEbit) {
      throw new Error('Invalid multiplier structure');
    }

    return multipliers;

  } catch (error) {
    console.error('Failed to get industry multipliers:', error);
    return getDefaultMultipliers();
  }
}

function getDefaultMultipliers() {
  return {
    revenue: {
      min: 0.5,
      avg: 0.8,
      max: 1.2,
      justification: "Yleinen PK-yritysten arvostuskerroin",
      source: "Toimialan keskiarvo"
    },
    evEbit: {
      min: 4.0,
      avg: 6.0,
      max: 8.0,
      justification: "Tyypillinen EV/EBIT PK-yrityksille",
      source: "Toimialan keskiarvo"
    }
  };
}