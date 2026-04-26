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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      app_roles: {
        Row: {
          description: string
          role: string
        }
        Insert: {
          description: string
          role: string
        }
        Update: {
          description?: string
          role?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      event_distances: {
        Row: {
          created_at: string
          distance: Database["public"]["Enums"]["event_distance"]
          distance_category: Database["public"]["Enums"]["distance_category"]
          event_id: string
          id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          distance: Database["public"]["Enums"]["event_distance"]
          distance_category: Database["public"]["Enums"]["distance_category"]
          event_id: string
          id?: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          distance?: Database["public"]["Enums"]["event_distance"]
          distance_category?: Database["public"]["Enums"]["distance_category"]
          event_id?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_distances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participations: {
        Row: {
          actual_distance_km: number | null
          created_at: string
          event_distance_id: string | null
          event_id: string
          finish_time_seconds: number | null
          id: string
          notes: string | null
          proof_image_path: string | null
          status: Database["public"]["Enums"]["participation_status"]
          timing_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_distance_km?: number | null
          created_at?: string
          event_distance_id?: string | null
          event_id: string
          finish_time_seconds?: number | null
          id?: string
          notes?: string | null
          proof_image_path?: string | null
          status?: Database["public"]["Enums"]["participation_status"]
          timing_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          actual_distance_km?: number | null
          created_at?: string
          event_distance_id?: string | null
          event_id?: string
          finish_time_seconds?: number | null
          id?: string
          notes?: string | null
          proof_image_path?: string | null
          status?: Database["public"]["Enums"]["participation_status"]
          timing_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participations_event_distance_id_fkey"
            columns: ["event_distance_id"]
            isOneToOne: false
            referencedRelation: "event_distances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          event_date: string
          event_url: string | null
          id: string
          location: string | null
          name: string
          province_id: number
          registration_deadline: string | null
          registration_opens: string | null
          registration_url: string | null
          timing_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_date: string
          event_url?: string | null
          id?: string
          location?: string | null
          name: string
          province_id: number
          registration_deadline?: string | null
          registration_opens?: string | null
          registration_url?: string | null
          timing_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_date?: string
          event_url?: string | null
          id?: string
          location?: string | null
          name?: string
          province_id?: number
          registration_deadline?: string | null
          registration_opens?: string | null
          registration_url?: string | null
          timing_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      medal_thresholds: {
        Row: {
          display_order: number
          medal: string
          min_distance_km: number
        }
        Insert: {
          display_order: number
          medal: string
          min_distance_km: number
        }
        Update: {
          display_order?: number
          medal?: string
          min_distance_km?: number
        }
        Relationships: []
      }
      profile_roles: {
        Row: {
          granted_at: string
          profile_id: string
          role: string
        }
        Insert: {
          granted_at?: string
          profile_id: string
          role: string
        }
        Update: {
          granted_at?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "app_roles"
            referencedColumns: ["role"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_public?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      provinces: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id: number
          name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_medal: { Args: { p_distance_km: number }; Returns: string }
      has_role: { Args: { role_name: string }; Returns: boolean }
    }
    Enums: {
      distance_category: "10k" | "half" | "marathon"
      event_distance:
        | "10k"
        | "15k"
        | "10_miles"
        | "half_marathon"
        | "30k"
        | "marathon"
      participation_status:
        | "interested"
        | "signed_up"
        | "completed"
        | "dns"
        | "dnf"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      distance_category: ["10k", "half", "marathon"],
      event_distance: [
        "10k",
        "15k",
        "10_miles",
        "half_marathon",
        "30k",
        "marathon",
      ],
      participation_status: [
        "interested",
        "signed_up",
        "completed",
        "dns",
        "dnf",
      ],
    },
  },
} as const
