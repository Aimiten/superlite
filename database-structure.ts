
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_conversation_files: {
        Row: {
          conversation_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_files_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          company_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_saved: boolean | null
          last_message_at: string | null
          messages: Json
          task_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_saved?: boolean | null
          last_message_at?: string | null
          messages?: Json
          task_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_saved?: boolean | null
          last_message_at?: string | null
          messages?: Json
          task_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "company_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          answers: Json | null
          company_id: string | null
          company_info: Json | null
          company_name: string
          created_at: string
          current_question_index: number | null
          current_step: string | null
          documents_metadata: Json | null
          id: string
          last_activity: string | null
          processing_progress: number | null
          processing_stage: string | null
          questions: Json | null
          readiness_for_sale_data: Json | null
          results: Json | null
          status: string | null
          structured_company_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          company_id?: string | null
          company_info?: Json | null
          company_name: string
          created_at?: string
          current_question_index?: number | null
          current_step?: string | null
          documents_metadata?: Json | null
          id?: string
          last_activity?: string | null
          processing_progress?: number | null
          processing_stage?: string | null
          questions?: Json | null
          readiness_for_sale_data?: Json | null
          results?: Json | null
          status?: string | null
          structured_company_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          company_id?: string | null
          company_info?: Json | null
          company_name?: string
          created_at?: string
          current_question_index?: number | null
          current_step?: string | null
          documents_metadata?: Json | null
          id?: string
          last_activity?: string | null
          processing_progress?: number | null
          processing_stage?: string | null
          questions?: Json | null
          readiness_for_sale_data?: Json | null
          results?: Json | null
          status?: string | null
          structured_company_data?: Json | null
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
          assessment_id: string | null
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
          share_tasks: boolean | null
          share_valuation_impact: boolean | null
          shared_by: string
          shared_documents: Json | null
          shared_tasks: Json | null
          shared_with: string | null
          updated_at: string
          valuation_id: string | null
          viewed_at: string | null
          viewer_email: string | null
        }
        Insert: {
          access_level?: string
          assessment_id?: string | null
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
          share_tasks?: boolean | null
          share_valuation_impact?: boolean | null
          shared_by: string
          shared_documents?: Json | null
          shared_tasks?: Json | null
          shared_with?: string | null
          updated_at?: string
          valuation_id?: string | null
          viewed_at?: string | null
          viewer_email?: string | null
        }
        Update: {
          access_level?: string
          assessment_id?: string | null
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
          share_tasks?: boolean | null
          share_valuation_impact?: boolean | null
          shared_by?: string
          shared_documents?: Json | null
          shared_tasks?: Json | null
          shared_with?: string | null
          updated_at?: string
          valuation_id?: string | null
          viewed_at?: string | null
          viewer_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_sharing_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_sharing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_sharing_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_tasks: {
        Row: {
          assessment_id: string | null
          category: string
          company_id: string
          completed_at: string | null
          completion_status: string
          created_at: string
          dd_related: boolean | null
          dependencies: Json | null
          description: string
          estimated_time: string | null
          expected_outcome: string | null
          id: string
          impact: string
          options: Json | null
          priority: string
          title: string
          type: string
          updated_at: string
          valuation_id: string | null
          value: Json | null
        }
        Insert: {
          assessment_id?: string | null
          category: string
          company_id: string
          completed_at?: string | null
          completion_status?: string
          created_at?: string
          dd_related?: boolean | null
          dependencies?: Json | null
          description: string
          estimated_time?: string | null
          expected_outcome?: string | null
          id?: string
          impact?: string
          options?: Json | null
          priority?: string
          title: string
          type?: string
          updated_at?: string
          valuation_id?: string | null
          value?: Json | null
        }
        Update: {
          assessment_id?: string | null
          category?: string
          company_id?: string
          completed_at?: string | null
          completion_status?: string
          created_at?: string
          dd_related?: boolean | null
          dependencies?: Json | null
          description?: string
          estimated_time?: string | null
          expected_outcome?: string | null
          id?: string
          impact?: string
          options?: Json | null
          priority?: string
          title?: string
          type?: string
          updated_at?: string
          valuation_id?: string | null
          value?: Json | null
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
      free_calculator_errors: {
        Row: {
          business_id: string | null
          company_name: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string
          id: string
          ip_address: string | null
          original_query: string | null
          query_type: string
          referer: string | null
          search_term: string | null
          user_agent: string | null
        }
        Insert: {
          business_id?: string | null
          company_name?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message: string
          id?: string
          ip_address?: string | null
          original_query?: string | null
          query_type: string
          referer?: string | null
          search_term?: string | null
          user_agent?: string | null
        }
        Update: {
          business_id?: string | null
          company_name?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string
          id?: string
          ip_address?: string | null
          original_query?: string | null
          query_type?: string
          referer?: string | null
          search_term?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      free_calculator_results: {
        Row: {
          business_id: string | null
          calculations: Json | null
          company_info: Json | null
          company_name: string
          created_at: string | null
          financial_data: Json | null
          id: string
          ip_address: string | null
          multipliers: Json | null
          rating: number | null
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          business_id?: string | null
          calculations?: Json | null
          company_info?: Json | null
          company_name: string
          created_at?: string | null
          financial_data?: Json | null
          id?: string
          ip_address?: string | null
          multipliers?: Json | null
          rating?: number | null
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          business_id?: string | null
          calculations?: Json | null
          company_info?: Json | null
          company_name?: string
          created_at?: string | null
          financial_data?: Json | null
          id?: string
          ip_address?: string | null
          multipliers?: Json | null
          rating?: number | null
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      free_valuations: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string | null
          file_type: string | null
          has_file: boolean
          id: string
          manual_inputs: Json | null
          normalization_questions: Json | null
          processed_financial_data: Json | null
          rating: number | null
          user_answers: Json | null
          valuation_results: Json | null
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string | null
          file_type?: string | null
          has_file?: boolean
          id?: string
          manual_inputs?: Json | null
          normalization_questions?: Json | null
          processed_financial_data?: Json | null
          rating?: number | null
          user_answers?: Json | null
          valuation_results?: Json | null
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string | null
          file_type?: string | null
          has_file?: boolean
          id?: string
          manual_inputs?: Json | null
          normalization_questions?: Json | null
          processed_financial_data?: Json | null
          rating?: number | null
          user_answers?: Json | null
          valuation_results?: Json | null
        }
        Relationships: []
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
          is_reply_to: string | null
          share_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_reply_to?: string | null
          share_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_reply_to?: string | null
          share_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_comments_is_reply_to_fkey"
            columns: ["is_reply_to"]
            isOneToOne: false
            referencedRelation: "share_comments"
            referencedColumns: ["id"]
          },
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
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          quantity: number | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          quantity?: number | null
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          quantity?: number | null
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      valuation_impact_analysis: {
        Row: {
          adjusted_valuation_result: Json | null
          adjustment_factors: Json | null
          analysis_phase: string | null
          calculation_date: string
          company_id: string
          completed_at: string | null
          created_at: string | null
          dd_risk_analysis: Json | null
          error_message: string | null
          id: string
          original_valuation_id: string
          original_valuation_snapshot: Json | null
          post_dd_risk_analysis: Json | null
          post_dd_sales_readiness_analysis: Json | null
          previous_analysis_id: string | null
          sales_readiness_analysis: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          adjusted_valuation_result?: Json | null
          adjustment_factors?: Json | null
          analysis_phase?: string | null
          calculation_date?: string
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          dd_risk_analysis?: Json | null
          error_message?: string | null
          id?: string
          original_valuation_id: string
          original_valuation_snapshot?: Json | null
          post_dd_risk_analysis?: Json | null
          post_dd_sales_readiness_analysis?: Json | null
          previous_analysis_id?: string | null
          sales_readiness_analysis?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          adjusted_valuation_result?: Json | null
          adjustment_factors?: Json | null
          analysis_phase?: string | null
          calculation_date?: string
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          dd_risk_analysis?: Json | null
          error_message?: string | null
          id?: string
          original_valuation_id?: string
          original_valuation_snapshot?: Json | null
          post_dd_risk_analysis?: Json | null
          post_dd_sales_readiness_analysis?: Json | null
          previous_analysis_id?: string | null
          sales_readiness_analysis?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_previous_analysis"
            columns: ["previous_analysis_id"]
            isOneToOne: false
            referencedRelation: "valuation_impact_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_impact_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_impact_analysis_original_valuation_id_fkey"
            columns: ["original_valuation_id"]
            isOneToOne: false
            referencedRelation: "valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      valuations: {
        Row: {
          company_id: string | null
          company_name: string
          created_at: string
          document_ids: Json | null
          id: string
          progress_data: Json | null
          results: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          company_name: string
          created_at?: string
          document_ids?: Json | null
          id?: string
          progress_data?: Json | null
          results?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          company_name?: string
          created_at?: string
          document_ids?: Json | null
          id?: string
          progress_data?: Json | null
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
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      airtable_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      airtable_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      airtable_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      auth0_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      auth0_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      auth0_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      big_query_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      big_query_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      big_query_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      click_house_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      click_house_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      click_house_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      cognito_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      cognito_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      cognito_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      direct_pgmq_send: {
        Args: { queue_name: string; message_body: string }
        Returns: string
      }
      firebase_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      firebase_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      firebase_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      get_public_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      hello_world_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      hello_world_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      hello_world_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      logflare_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      logflare_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      logflare_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      mssql_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      mssql_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      mssql_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      queue_archive: {
        Args: { queue_name: string; msg_id: number }
        Returns: undefined
      }
      queue_pop: {
        Args: { queue_name: string; count?: number }
        Returns: Json
      }
      queue_send: {
        Args: { queue_name: string; message: Json }
        Returns: string
      }
      redis_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      redis_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      redis_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      s3_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      s3_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      s3_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      stripe_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      stripe_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      stripe_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      wasm_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      wasm_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      wasm_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
