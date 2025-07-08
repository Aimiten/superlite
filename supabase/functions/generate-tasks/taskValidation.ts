// supabase/functions/generate-tasks/taskValidation.ts
import { TaskCategory, TaskType, TaskPriority, TaskImpact, CompletionStatus, Task } from "./types.ts";

// Hyväksytyt arvot tietokannan check constraintien mukaan
export const VALID_CATEGORIES: TaskCategory[] = ['financial', 'legal', 'operations', 'documentation', 'customers', 'personnel', 'strategy'];
export const VALID_TYPES: TaskType[] = ['checkbox', 'multiple_choice', 'text_input', 'document_upload', 'explanation', 'contact_info'];
export const VALID_PRIORITIES: TaskPriority[] = ['high', 'medium', 'low'];
export const VALID_IMPACTS: TaskImpact[] = ['high', 'medium', 'low'];
export const VALID_STATUSES: CompletionStatus[] = ['not_started', 'in_progress', 'completed'];

// Oletusarvot virheellisten arvojen varalle
export const DEFAULT_VALUES = {
  category: 'operations' as TaskCategory,
  type: 'checkbox' as TaskType,
  priority: 'medium' as TaskPriority,
  impact: 'medium' as TaskImpact,
  completion_status: 'not_started' as CompletionStatus
};

// Mahdolliset synonyymit tai vaihtoehtoiset kirjoitusasut
const CATEGORY_MAPPINGS: Record<string, TaskCategory> = {
  // Englanninkieliset variaatiot
  'finance': 'financial',
  'finances': 'financial',
  'juridical': 'legal',
  'legal_compliance': 'legal',
  'customer': 'customers',
  'client': 'customers',
  'clients': 'customers',
  'hr': 'personnel',
  'human_resources': 'personnel',
  'staff': 'personnel',
  'ops': 'operations',
  'docs': 'documentation',
  'documents': 'documentation',

  // Suomenkieliset (koska promptit ovat suomeksi)
  'talous': 'financial',
  'sopimukset': 'legal',
  'juridiikka': 'legal',
  'asiakkaat': 'customers',
  'henkilöstö': 'personnel',
  'toiminta': 'operations',
  'dokumentaatio': 'documentation',
  'strategia': 'strategy'
};

/**
 * Validoi ja normalisoi yksittäisen kentän arvon
 */
function validateField<T extends string>(
  value: string | undefined,
  validValues: T[],
  defaultValue: T,
  fieldName: string,
  taskIndex: number,
  mappings?: Record<string, T>
): T {
  if (!value) {
    console.warn(`Tehtävä ${taskIndex + 1}: ${fieldName} puuttuu, käytetään oletusarvoa "${defaultValue}"`);
    return defaultValue;
  }

  // Muunna lowercase-muotoon
  const normalized = value.toLowerCase().trim();

  // Tarkista onko arvo suoraan hyväksytty
  if (validValues.includes(normalized as T)) {
    return normalized as T;
  }

  // Tarkista löytyykö mapping-taulukosta
  if (mappings && mappings[normalized]) {
    const mapped = mappings[normalized];
    console.log(`Tehtävä ${taskIndex + 1}: Muunnettiin ${fieldName} "${value}" → "${mapped}"`);
    return mapped;
  }

  // Jos ei löydy, käytä oletusarvoa
  console.warn(`Tehtävä ${taskIndex + 1}: Virheellinen ${fieldName} "${value}", käytetään oletusarvoa "${defaultValue}"`);
  return defaultValue;
}

/**
 * Validoi ja sanitoi tehtävän kaikki kentät
 */
export function validateAndSanitizeTask(task: Task, index: number): {
  category: TaskCategory;
  type: TaskType;
  priority: TaskPriority;
  impact: TaskImpact;
  completion_status: CompletionStatus;
} {
  return {
    category: validateField(
      task.category,
      VALID_CATEGORIES,
      DEFAULT_VALUES.category,
      'kategoria',
      index,
      CATEGORY_MAPPINGS
    ),
    type: validateField(
      task.type,
      VALID_TYPES,
      DEFAULT_VALUES.type,
      'tyyppi',
      index
    ),
    priority: validateField(
      task.priority,
      VALID_PRIORITIES,
      DEFAULT_VALUES.priority,
      'prioriteetti',
      index
    ),
    impact: validateField(
      task.impact,
      VALID_IMPACTS,
      DEFAULT_VALUES.impact,
      'vaikutus',
      index
    ),
    completion_status: validateField(
      task.completion_status,
      VALID_STATUSES,
      DEFAULT_VALUES.completion_status,
      'tila',
      index
    )
  };
}

/**
 * Validoi tehtävän pakolliset kentät
 */
export function validateRequiredFields(task: Task, index: number): {
  title: string;
  description: string;
} {
  if (!task.title || task.title.trim() === '') {
    console.warn(`Tehtävä ${index + 1}: Otsikko puuttuu, käytetään generoitua otsikkoa`);
  }

  if (!task.description || task.description.trim() === '') {
    console.warn(`Tehtävä ${index + 1}: Kuvaus puuttuu, käytetään tyhjää kuvausta`);
  }

  return {
    title: task.title?.trim() || `Tehtävä ${index + 1}`,
    description: task.description?.trim() || ""
  };
}