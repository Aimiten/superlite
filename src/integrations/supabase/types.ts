export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assessments: {
        Row: {
          answers: Json | null
          company_id: string | null
          company_name: string
          created_at: string
          id: string
          results: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          company_id?: string | null
          company_name: string
          created_at?: string
          id?: string
          results?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          company_id?: string | null
          company_name?: string
          created_at?: string
          id?: string
          results?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          business_id: string | null
          company_type: string | null
          created_at: string
          description: string | null
          employees: string | null
          founded: string | null
          id: string
          industry: string | null
          is_public: boolean
          name: string
          ownership_change_other: string | null
          ownership_change_type: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          business_id?: string | null
          company_type?: string | null
          created_at?: string
          description?: string | null
          employees?: string | null
          founded?: string | null
          id?: string
          industry?: string | null
          is_public?: boolean
          name: string
          ownership_change_other?: string | null
          ownership_change_type?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          business_id?: string | null
          company_type?: string | null
          created_at?: string
          description?: string | null
          employees?: string | null
          founded?: string | null
          id?: string
          industry?: string | null
          is_public?: boolean
          name?: string
          ownership_change_other?: string | null
          ownership_change_type?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_documents: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          document_type: string
          file_path: string | null
          file_type: string | null
          id: string
          is_processed: boolean
          is_public: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          document_type: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_processed?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          document_type?: string
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_processed?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_info: {
        Row: {
          brand_and_reputation: string | null
          business_description: string | null
          company_id: string
          competition: string | null
          created_at: string
          customer_and_market: string | null
          employees_count: string | null
          id: string
          opportunities: string | null
          raw_response: Json | null
          readiness_for_sale_data: Json | null
          risks_and_regulation: string | null
          sources: string | null
          strategy_and_future: string | null
          strengths: string | null
          threats: string | null
          updated_at: string
          weaknesses: string | null
        }
        Insert: {
          brand_and_reputation?: string | null
          business_description?: string | null
          company_id: string
          competition?: string | null
          created_at?: string
          customer_and_market?: string | null
          employees_count?: string | null
          id?: string
          opportunities?: string | null
          raw_response?: Json | null
          readiness_for_sale_data?: Json | null
          risks_and_regulation?: string | null
          sources?: string | null
          strategy_and_future?: string | null
          strengths?: string | null
          threats?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Update: {
          brand_and_reputation?: string | null
          business_description?: string | null
          company_id?: string
          competition?: string | null
          created_at?: string
          customer_and_market?: string | null
          employees_count?: string | null
          id?: string
          opportunities?: string | null
          raw_response?: Json | null
          readiness_for_sale_data?: Json | null
          risks_and_regulation?: string | null
          sources?: string | null
          strategy_and_future?: string | null
          strengths?: string | null
          threats?: string | null
          updated_at?: string
          weaknesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_info_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_sharing: {
        Row: {
          access_level: string
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          share_basic_info: boolean
          share_documents: boolean
          share_financial_info: boolean
          share_link: string | null
          share_link_password: string | null
          shared_by: string
          shared_with: string
          updated_at: string
          viewed_at: string | null
          viewer_email: string | null
        }
        Insert: {
          access_level?: string
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_basic_info?: boolean
          share_documents?: boolean
          share_financial_info?: boolean
          share_link?: string | null
          share_link_password?: string | null
          shared_by: string
          shared_with: string
          updated_at?: string
          viewed_at?: string | null
          viewer_email?: string | null
        }
        Update: {
          access_level?: string
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          share_basic_info?: boolean
          share_documents?: boolean
          share_financial_info?: boolean
          share_link?: string | null
          share_link_password?: string | null
          shared_by?: string
          shared_with?: string
          updated_at?: string
          viewed_at?: string | null
          viewer_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_sharing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_tasks: {
        Row: {
          assessment_id: string | null
          category: string
          company_id: string
          created_at: string
          description: string
          expected_outcome: string | null
          id: string
          is_completed: boolean
          response_type: string
          title: string
          updated_at: string
          urgency: string
          valuation_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          category: string
          company_id: string
          created_at?: string
          description: string
          expected_outcome?: string | null
          id?: string
          is_completed?: boolean
          response_type: string
          title: string
          updated_at?: string
          urgency: string
          valuation_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          category?: string
          company_id?: string
          created_at?: string
          description?: string
          expected_outcome?: string | null
          id?: string
          is_completed?: boolean
          response_type?: string
          title?: string
          updated_at?: string
          urgency?: string
          valuation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_tasks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_tasks_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      share_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          share_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          share_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          share_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_comments_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "company_sharing"
            referencedColumns: ["id"]
          },
        ]
      }
      share_view_logs: {
        Row: {
          id: string
          share_id: string
          viewed_at: string
          viewer_email: string | null
          viewer_ip: string | null
        }
        Insert: {
          id?: string
          share_id: string
          viewed_at?: string
          viewer_email?: string | null
          viewer_ip?: string | null
        }
        Update: {
          id?: string
          share_id?: string
          viewed_at?: string
          viewer_email?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_view_logs_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "company_sharing"
            referencedColumns: ["id"]
          },
        ]
      }
      task_responses: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string | null
          id: string
          task_id: string
          text_response: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          task_id: string
          text_response?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          task_id?: string
          text_response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_responses_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "company_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      valuations: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          document_path: string | null
          id: string
          results: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          document_path?: string | null
          id?: string
          results?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          document_path?: string | null
          id?: string
          results?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
