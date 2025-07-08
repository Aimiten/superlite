import { getParameterSchema, baseDCFParameterSchema } from "../schemas/parameter-schemas.ts";
import { ComprehensiveMarketData } from "../types/dcf-types.ts";

export function getVariantSchema(variant: string, marketData?: ComprehensiveMarketData, marketBasedWACC?: number): any {
  // Map old variant names to new schema types
  let schemaType: 'saas' | 'traditional' | 'growth' | 'mature';
  
  switch (variant) {
    case 'full_dcf':
      schemaType = 'traditional'; // Full DCF maps to traditional business
      break;
    case 'simplified_dcf':
      schemaType = 'growth'; // Simplified maps to growth company
      break;
    case 'forward_looking_dcf':
      schemaType = 'saas'; // Forward-looking maps to SaaS
      break;
    default:
      schemaType = 'growth'; // Fallback to growth
  }
  
  // Get the appropriate parameter schema
  const schema = getParameterSchema(schemaType);
  
  // Note: Market data placeholders are no longer needed as the new schemas
  // use structured parameters instead of text templates
  return schema;
}


export function getVariantSpecificInstructions(variant: string): string {
  // Map variant to appropriate business type instructions
  switch (variant) {
    case 'full_dcf':
      return `Generate DCF parameters for a traditional business with established operations, 
              focusing on stable margins, predictable capital requirements, and traditional working capital cycles.`;
    case 'simplified_dcf':
      return `Generate DCF parameters for a growth company with expanding market share, 
              emphasizing revenue growth, R&D investments, and customer acquisition strategies.`;
    case 'forward_looking_dcf':
      return `Generate DCF parameters for a SaaS business model, 
              focusing on recurring revenue, churn rates, customer acquisition costs, and ARPU trends.`;
    default:
      return `Generate DCF parameters for a growth company with expanding market share, 
              emphasizing revenue growth, R&D investments, and customer acquisition strategies.`;
  }
}