// supabase/functions/generate-tasks/types.ts

export type ExitType = 'share_sale' | 'business_sale' | 'generational_change' | 'other';
export type Timeline = 'immediate' | 'short_term' | 'mid_term' | 'long_term';
export type TaskCategory = 'financial' | 'legal' | 'customers' | 'personnel' | 'operations' | 'documentation' | 'strategy';
export type TaskType = 'checkbox' | 'multiple_choice' | 'text_input' | 'document_upload' | 'explanation' | 'contact_info';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskImpact = 'high' | 'medium' | 'low';
export type CompletionStatus = 'not_started' | 'in_progress' | 'completed';

export interface ExitSuggestion {
  exitType: ExitType;
  exitTypeDescription: string;
  timeline: Timeline;
  timelineDescription: string;
  reasoning: string;
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  type: TaskType;
  category: TaskCategory;
  priority: TaskPriority;
  impact: TaskImpact;
  estimated_time: string;
  completion_status: CompletionStatus;
  options?: string[];
  value?: any;
  dependencies?: string[];
  depends_on_indexes?: number[]; // Uusi kenttä indeksipohjaisille riippuvuuksille
  response_type?: string; // Added response_type field
}

export interface TaskRequest {
  companyId: string;
  assessmentId: string;
  valuationId: string;
  exitType?: ExitType;
  timeline?: Timeline;
  generateSuggestionsOnly?: boolean;
  regenerateSuggestion?: boolean;
}

export interface SuggestionResponse {
  suggestion: ExitSuggestion;
  suggestedIssues: string[];
}

export interface TaskGenerationResponse {
  success: boolean;
  message: string;
  tasks?: Task[];
  taskCount?: number;
  suggestion?: ExitSuggestion;
  suggestedIssues?: string[];
}