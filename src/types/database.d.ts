
// Declare types for the database tables
// This helps with TypeScript support for the Supabase queries

declare module 'database-types' {
  export interface Assessment {
    id: string;
    user_id: string;
    company_name: string;
    results: any;
    answers?: Record<string, number>;
    created_at: string;
    updated_at?: string;
  }
}
