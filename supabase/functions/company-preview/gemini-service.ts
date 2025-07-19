// Gemini 2.5 Flash-Lite integration for quick company analysis
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

interface CompanyTeaser {
  teaser: string;
  whyValuable: string;
  marketSituation: string;
}

export async function generateCompanyTeaser(ytjData: any): Promise<CompanyTeaser | null> {
  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return null;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-thinking-exp",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    const prompt = `
    Analysoi suomalainen yritys lyhyesti:
    Nimi: ${ytjData.name}
    Toimiala: ${ytjData.businessLine || 'Ei tiedossa'}
    Perustettu: ${new Date(ytjData.registrationDate).getFullYear()}
    
    Vastaa AINA suomeksi ja anna JSON-muodossa:
    {
      "teaser": "1 lause mikä kuvaa yritystä houkuttelevasti (max 15 sanaa)",
      "whyValuable": "1 lause miksi yritys voi olla arvokas ostajalle (max 15 sanaa)",
      "marketSituation": "1 lause toimialan markkinatilanteesta juuri nyt (max 20 sanaa)"
    }
    
    Ole konkreettinen ja positiivinen. Älä käytä yleisiä fraaseja.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response');
      return null;
    }
    
    return JSON.parse(jsonMatch[0]);
    
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return null;
  }
}