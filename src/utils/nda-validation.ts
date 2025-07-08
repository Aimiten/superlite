import { z } from 'zod';

// NDA Configuration validation schema
export const ndaConfigSchema = z.object({
  template: z.enum(['sale_process', 'investment', 'partnership', 'custom']),
  duration: z.enum(['6_months', '1_year', '2_years', '3_years', '5_years']),
  penalty: z.enum(['10000', '25000', '50000', '100000']),
  additionalTerms: z.string().max(1000, 'Erityisehdot voivat olla enintään 1000 merkkiä').optional(),
  specificInfo: z.string().max(500, 'Erityistiedot voivat olla enintään 500 merkkiä').optional()
});

// Signer information validation schema
export const signerInfoSchema = z.object({
  name: z.string()
    .min(2, 'Nimi on liian lyhyt')
    .max(100, 'Nimi on liian pitkä')
    .regex(/^[a-zA-ZäöåÄÖÅ\s\-']+$/, 'Nimi sisältää virheellisiä merkkejä'),
  email: z.string().email('Virheellinen sähköpostiosoite'),
  company: z.string().max(100, 'Yrityksen nimi on liian pitkä').optional(),
  title: z.string().max(100, 'Titteli on liian pitkä').optional()
});

// Sanitize text inputs to prevent XSS
export const sanitizeTextInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

// Validate and sanitize NDA configuration
export const validateNDAConfig = (config: unknown) => {
  try {
    const validated = ndaConfigSchema.parse(config);
    
    // Sanitize optional text fields
    if (validated.additionalTerms) {
      validated.additionalTerms = sanitizeTextInput(validated.additionalTerms);
    }
    if (validated.specificInfo) {
      validated.specificInfo = sanitizeTextInput(validated.specificInfo);
    }
    
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation error' }] };
  }
};

// Validate signer information
export const validateSignerInfo = (info: unknown) => {
  try {
    const validated = signerInfoSchema.parse(info);
    
    // Sanitize all fields
    validated.name = sanitizeTextInput(validated.name);
    validated.email = validated.email.toLowerCase().trim();
    if (validated.company) {
      validated.company = sanitizeTextInput(validated.company);
    }
    if (validated.title) {
      validated.title = sanitizeTextInput(validated.title);
    }
    
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      };
    }
    return { success: false, errors: [{ field: 'unknown', message: 'Validation error' }] };
  }
};