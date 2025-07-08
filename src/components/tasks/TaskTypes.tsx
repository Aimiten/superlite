// src/components/tasks/TaskTypes.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'checkbox' | 'multiple_choice' | 'text_input' | 'document_upload' | 'explanation' | 'contact_info';
  category: 'financial' | 'legal' | 'operations' | 'documentation' | 'customers' | 'personnel' | 'strategy';
  priority: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low' | null; // Sallitaan null
  estimated_time?: string | null; // Sallitaan null
  completion_status: 'not_started' | 'in_progress' | 'completed';
  options?: string[];
  value?: any; // Käyttäjän vastaus/data tähän
  dependencies?: string[];
  expected_outcome?: string | null; // Sallitaan null
  company_id: string;
  dd_related?: boolean;
  // Lisää muut mahdolliset kentät kuten created_at, updated_at jos tarpeen
}

export interface FilterState {
  categories: string[];
  priorities: string[];
  impacts: string[];
  completionStatus: string[];
}
