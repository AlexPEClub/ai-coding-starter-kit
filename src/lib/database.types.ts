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
      activities: {
        Row: {
          created_at: string
          current_votes: number
          description: string | null
          duration_category: string
          end_date: string | null
          group_id: string
          id: string
          initiator_id: string
          location: string | null
          name: string
          og_image_url: string | null
          required_votes: number
          start_date: string | null
          status: string
          url: string | null
        }
        Insert: {
          created_at?: string
          current_votes?: number
          description?: string | null
          duration_category: string
          end_date?: string | null
          group_id: string
          id?: string
          initiator_id: string
          location?: string | null
          name: string
          og_image_url?: string | null
          required_votes: number
          start_date?: string | null
          status?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          current_votes?: number
          description?: string | null
          duration_category?: string
          end_date?: string | null
          group_id?: string
          id?: string
          initiator_id?: string
          location?: string | null
          name?: string
          og_image_url?: string | null
          required_votes?: number
          start_date?: string | null
          status?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_initiator_id_fkey"
            columns: ["initiator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_votes: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_votes_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_comments: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          content: Json
          mentioned_user_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          content: Json
          mentioned_user_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          content?: Json
          mentioned_user_ids?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_responsibilities: {
        Row: {
          id: string
          activity_id: string
          label: string
          assigned_user_id: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          label: string
          assigned_user_id: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          label?: string
          assigned_user_id?: string
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_responsibilities_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_responsibilities_assigned_user_id_fkey"
            columns: ["assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_responsibilities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          id: string
          user_id: string
          google_email: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          google_email: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          google_email?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      user_date_blocks: {
        Row: {
          id: string
          user_id: string
          start_date: string
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_date: string
          end_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_date?: string
          end_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      group_availability_cache: {
        Row: {
          id: string
          group_id: string
          cached_at: string
          data: Json
        }
        Insert: {
          id?: string
          group_id: string
          cached_at?: string
          data?: Json
        }
        Update: {
          id?: string
          group_id?: string
          cached_at?: string
          data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "group_availability_cache_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_photos: {
        Row: {
          id: string
          activity_id: string
          user_id: string
          storage_path: string
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          user_id: string
          storage_path: string
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          user_id?: string
          storage_path?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_photos_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: 'admin' | 'editor' | 'observer'
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          role?: 'admin' | 'editor' | 'observer'
          joined_at?: string
        }
        Update: {
          group_id?: string
          user_id?: string
          role?: 'admin' | 'editor' | 'observer'
          joined_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          status: 'pending' | 'active'
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          status?: 'pending' | 'active'
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          status?: 'pending' | 'active'
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_group_with_membership: {
        Args: { p_name: string }
        Returns: Json
      }
      join_group_by_invite_code: {
        Args: { p_invite_code: string }
        Returns: Json
      }
      is_group_member: {
        Args: { gid: string }
        Returns: boolean
      }
      is_group_admin: {
        Args: { gid: string }
        Returns: boolean
      }
      reset_activity_votes: {
        Args: { p_activity_id: string }
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
