export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      document_views: {
        Row: {
          document_id: string
          id: string
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          document_id: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          document_id?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_views_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "partner_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          address: string | null
          contact_person: string
          created_at: string
          email: string
          firm_name: string
          firm_size: string | null
          id: string
          message: string | null
          partnership_type: string
          phone: string | null
          practice_areas: string[]
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
          years_in_practice: number | null
        }
        Insert: {
          address?: string | null
          contact_person: string
          created_at?: string
          email: string
          firm_name: string
          firm_size?: string | null
          id?: string
          message?: string | null
          partnership_type: string
          phone?: string | null
          practice_areas: string[]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
          years_in_practice?: number | null
        }
        Update: {
          address?: string | null
          contact_person?: string
          created_at?: string
          email?: string
          firm_name?: string
          firm_size?: string | null
          id?: string
          message?: string | null
          partnership_type?: string
          phone?: string | null
          practice_areas?: string[]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          years_in_practice?: number | null
        }
        Relationships: []
      }
      partner_documents: {
        Row: {
          access_level: string
          category: string | null
          created_at: string
          description: string | null
          document_type: string
          downloads_count: number
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_premium: boolean
          partner_id: string
          preview_image_url: string | null
          published_at: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          access_level?: string
          category?: string | null
          created_at?: string
          description?: string | null
          document_type: string
          downloads_count?: number
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_premium?: boolean
          partner_id: string
          preview_image_url?: string | null
          published_at?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          access_level?: string
          category?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          downloads_count?: number
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_premium?: boolean
          partner_id?: string
          preview_image_url?: string | null
          published_at?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          address: string | null
          commission_rate: number
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          firm_name: string
          id: string
          is_active: boolean
          logo_url: string | null
          practice_areas: string[]
          total_documents: number
          total_revenue: number
          total_views: number
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          commission_rate?: number
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          firm_name: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          practice_areas: string[]
          total_documents?: number
          total_revenue?: number
          total_views?: number
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          commission_rate?: number
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          firm_name?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          practice_areas?: string[]
          total_documents?: number
          total_revenue?: number
          total_views?: number
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_period: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_documents: number | null
          name: string
          price: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          billing_period: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_documents?: number | null
          name: string
          price: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_documents?: number | null
          name?: string
          price?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "partner" | "pro_user" | "free_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "partner", "pro_user", "free_user"],
    },
  },
} as const
