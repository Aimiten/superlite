
export type QuestionType = "scale" | "file" | "text" | "custom";

export interface AssessmentQuestion {
  id: string;
  question: string;
  description: string;
  category?: string;
  type: QuestionType;
  context?: string;
  amount?: number;
  period?: string;
}

// Generic default questions used before we get the financial analysis
export const defaultQuestions: AssessmentQuestion[] = [
  {
    id: "doc1",
    question: "Sopimusdokumentaatio",
    description: "Onko yrityksellänne kirjalliset ja ajantasaiset sopimukset kaikkien asiakkaiden, toimittajien ja henkilöstön kanssa?",
    category: "documentation",
    type: "scale"
  },
  {
    id: "doc2",
    question: "Prosessidokumentaatio",
    description: "Kuinka hyvin liiketoimintaprosessit on dokumentoitu?",
    category: "documentation",
    type: "scale"
  },
  {
    id: "proc1",
    question: "Prosessien tehokkuus",
    description: "Kuinka tehokkaita ja automatisoituja keskeiset liiketoimintaprosessinne ovat?",
    category: "process",
    type: "scale"
  },
  {
    id: "proc2",
    question: "Henkilöriippuvuus",
    description: "Kuinka riippuvainen liiketoimintanne on yksittäisistä avainhenkilöistä?",
    category: "process",
    type: "scale"
  },
  {
    id: "fin1",
    question: "Taloudellinen vakaus",
    description: "Kuinka vakaa yrityksenne taloudellinen tilanne on (kannattavuus, maksuvalmius, vakavaraisuus)?",
    category: "financial",
    type: "scale"
  },
  {
    id: "fin2",
    question: "Tilinpäätöstiedot",
    description: "Lataa viimeisimmät tilinpäätöstiedot analyysiä varten",
    type: "file"
  },
  {
    id: "cust1",
    question: "Asiakasportfolio",
    description: "Kuinka hyvin asiakaskuntanne on hajautettu (ei yksittäisiä dominoivia asiakkaita)?",
    category: "customers",
    type: "scale"
  },
  {
    id: "cust2",
    question: "Asiakassuhteiden kesto",
    description: "Kuinka pitkäkestoisia asiakassuhteenne keskimäärin ovat?",
    category: "customers",
    type: "scale"
  },
  {
    id: "doc3",
    question: "Immateriaalioikeudet",
    description: "Kuinka hyvin yrityksenne immateriaalioikeudet on suojattu ja dokumentoitu?",
    category: "documentation",
    type: "scale"
  },
  {
    id: "fin3",
    question: "Ennustettavuus",
    description: "Kuinka hyvin liikevaihto ja tulos ovat ennustettavissa?",
    category: "financial",
    type: "scale"
  }
];

// Custom financial questions for sample/development
export const sampleFinancialQuestions: AssessmentQuestion[] = [
  {
    id: "fin_custom_1",
    question: "Kassavarat",
    description: "Riittävätkö yrityksenne kassavarat liiketoiminnan ylläpitämiseen ja kehittämiseen?",
    category: "financial",
    type: "scale",
    context: "Rahat ja pankkisaamiset: 50 000€",
    amount: 50000,
    period: "2023"
  },
  {
    id: "fin_custom_2",
    question: "Asiakaskeskittymä",
    description: "Onko yrityksenne liian riippuvainen suurimmasta asiakkaastaan?",
    category: "customers",
    type: "scale",
    context: "Suurin asiakas vastaa 43% liikevaihdosta",
    amount: 43,
    period: "2023"
  },
  {
    id: "fin_custom_3",
    question: "Korollinen velka",
    description: "Onko yrityksenne korollinen velka sopivalla tasolla suhteessa käyttökatteeseen?",
    category: "financial",
    type: "scale",
    context: "Korollinen velka: 120 000€, Käyttökate: 80 000€",
    amount: 120000,
    period: "2023"
  }
];

// Empty initial questions array - will be populated with either default questions
// or questions from Gemini's financial analysis
export const questions: AssessmentQuestion[] = [];
