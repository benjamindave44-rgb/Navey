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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_claims: {
        Row: {
          claimant_email: string
          claimant_id: string
          claimant_name: string
          created_at: string
          id: string
          proof_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          spot_id: string
          status: string
        }
        Insert: {
          claimant_email: string
          claimant_id: string
          claimant_name: string
          created_at?: string
          id?: string
          proof_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spot_id: string
          status?: string
        }
        Update: {
          claimant_email?: string
          claimant_id?: string
          claimant_name?: string
          created_at?: string
          id?: string
          proof_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spot_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_claims_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_claimant_id_fkey"
            columns: ["claimant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_photos: {
        Row: {
          collection_id: string
          id: string
          position: number
          url: string
        }
        Insert: {
          collection_id: string
          id?: string
          position?: number
          url: string
        }
        Update: {
          collection_id?: string
          id?: string
          position?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_photos_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_spots: {
        Row: {
          collection_id: string
          rank: number
          spot_id: string
        }
        Insert: {
          collection_id: string
          rank?: number
          spot_id: string
        }
        Update: {
          collection_id?: string
          rank?: number
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_spots_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_spots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          curator_id: string | null
          description: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          curator_id?: string | null
          description?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          curator_id?: string | null
          description?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_curator_id_fkey"
            columns: ["curator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id: string
          role?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      review_photos: {
        Row: {
          id: string
          review_id: string
          url: string
        }
        Insert: {
          id?: string
          review_id: string
          url: string
        }
        Update: {
          id?: string
          review_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_hits: {
        Row: {
          bucket: string
          created_at: string
          id: number
        }
        Insert: {
          bucket: string
          created_at?: string
          id?: number
        }
        Update: {
          bucket?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      review_reports: {
        Row: {
          created_at: string
          reason: string | null
          reporter_id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          reason?: string | null
          reporter_id: string
          review_id: string
        }
        Update: {
          created_at?: string
          reason?: string | null
          reporter_id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          needs_review: boolean
          rating: number
          spot_id: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          needs_review?: boolean
          rating: number
          spot_id: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          needs_review?: boolean
          rating?: number
          spot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_list_spots: {
        Row: {
          list_id: string
          spot_id: string
        }
        Insert: {
          list_id: string
          spot_id: string
        }
        Update: {
          list_id?: string
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_list_spots_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "saved_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_list_spots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_lists: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_hours: {
        Row: {
          close_time: string | null
          day_of_week: number
          is_24_hours: boolean
          is_closed: boolean
          open_time: string | null
          spot_id: string
        }
        Insert: {
          close_time?: string | null
          day_of_week: number
          is_24_hours?: boolean
          is_closed?: boolean
          open_time?: string | null
          spot_id: string
        }
        Update: {
          close_time?: string | null
          day_of_week?: number
          is_24_hours?: boolean
          is_closed?: boolean
          open_time?: string | null
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_hours_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_photos: {
        Row: {
          created_at: string
          id: string
          kind: string
          spot_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          spot_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          spot_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_photos_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_tags: {
        Row: {
          spot_id: string
          tag_id: number
        }
        Insert: {
          spot_id: string
          tag_id: number
        }
        Update: {
          spot_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "spot_tags_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      spots: {
        Row: {
          accepts_bank_transfer: boolean
          accepts_cards: boolean
          accepts_cash: boolean
          accepts_qr_ph: boolean
          address: string
          category: string
          city: string
          created_at: string
          description: string | null
          featured: boolean
          featured_rank: number
          hidden_gem: boolean
          id: string
          lat: number | null
          lighting: string | null
          lng: number | null
          music_style: string | null
          name: string
          needs_review: boolean
          noise_level: string | null
          price_range: string | null
          province: string | null
          pwd_friendly: boolean
          save_count: number
          seating_style: string | null
          status: string
          submitted_by: string | null
        }
        Insert: {
          accepts_bank_transfer?: boolean
          accepts_cards?: boolean
          accepts_cash?: boolean
          accepts_qr_ph?: boolean
          address: string
          category: string
          city: string
          created_at?: string
          description?: string | null
          featured?: boolean
          featured_rank?: number
          hidden_gem?: boolean
          id?: string
          lat?: number | null
          lighting?: string | null
          lng?: number | null
          music_style?: string | null
          name: string
          needs_review?: boolean
          noise_level?: string | null
          price_range?: string | null
          province?: string | null
          pwd_friendly?: boolean
          save_count?: number
          seating_style?: string | null
          status?: string
          submitted_by?: string | null
        }
        Update: {
          accepts_bank_transfer?: boolean
          accepts_cards?: boolean
          accepts_cash?: boolean
          accepts_qr_ph?: boolean
          address?: string
          category?: string
          city?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          featured_rank?: number
          hidden_gem?: boolean
          id?: string
          lat?: number | null
          lighting?: string | null
          lng?: number | null
          music_style?: string | null
          name?: string
          needs_review?: boolean
          noise_level?: string | null
          price_range?: string | null
          province?: string | null
          pwd_friendly?: boolean
          save_count?: number
          seating_style?: string | null
          status?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spots_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          icon: string | null
          id: number
          label: string
          sort_order: number
          tag_group: string
        }
        Insert: {
          icon?: string | null
          id?: number
          label: string
          sort_order?: number
          tag_group?: string
        }
        Update: {
          icon?: string | null
          id?: number
          label?: string
          sort_order?: number
          tag_group?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window: string }
        Returns: boolean
      }
      admin_list_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          display_name: string | null
          role: string
          created_at: string
          provider: string | null
        }[]
      }
      delete_own_account: {
        Args: Record<PropertyKey, never>
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
    Enums: {},
  },
} as const
