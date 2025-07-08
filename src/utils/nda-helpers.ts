// Shared NDA utility functions to avoid duplication

export const getDurationLabel = (duration: string): string => {
  const labels: Record<string, string> = {
    '6_months': '6 kuukautta',
    '1_year': '1 vuosi',
    '2_years': '2 vuotta',
    '3_years': '3 vuotta',
    '5_years': '5 vuotta'
  };
  return labels[duration] || duration;
};

export const getPenaltyLabel = (penalty: string): string => {
  if (penalty === 'none') {
    return 'Ei tarkkaa summaa';
  }
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR'
  }).format(parseInt(penalty));
};

export const getRecipientLabel = (template: string): string => {
  const labels: Record<string, string> = {
    'sale_process': 'Potentiaalinen ostaja',
    'investment': 'Sijoittaja',
    'partnership': 'Yhteistyökumppani',
    'custom': 'Muu vastaanottaja'
  };
  return labels[template] || 'Vastaanottaja';
};

// Sanitize markdown content for safe display
export const sanitizeMarkdown = (content: string): string => {
  // Basic sanitization - in production use DOMPurify
  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate NDA configuration
export const validateNDAConfig = (config: unknown): boolean => {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  if (!c.template || !c.duration || !c.penalty) {
    return false;
  }
  
  // Check for malicious content in additional terms
  if (c.additionalTerms && typeof c.additionalTerms === 'string' && c.additionalTerms.length > 1000) {
    return false;
  }
  
  return true;
};