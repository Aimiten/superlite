// src/constants/fileTypes.ts
/**
 * Hyväksyttävät tiedostomuodot eri komponenteissa. Liittyy chatin dokkareihin
 */

// Kaikki sallitut tiedostomuodot pilkuilla eroteltuna input-elementin accept-attribuuttia varten
export const ACCEPTED_FILE_FORMATS = ".txt,.csv,.json,.xml,.html,.md,.jpg,.jpeg,.png,.gif,.webp,.svg,.pdf";

// Tiedostotyypit useFileUpload-hookia varten
export const ALLOWED_FILE_TYPES = [
  'text/', // Kaikki tekstitiedostot
  'application/json', 
  'application/xml',
  'image/', // Kaikki kuvatiedostot
  'application/pdf'
];

// Maksimitiedostokoko megatavuina
export const MAX_FILE_SIZE_MB = 10; // 10 MB

// Maksimitiedostokoko tavuina
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // 10 MB