export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          role: 'owner' | 'therapist' | 'client'
          full_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id: string
          role: 'owner' | 'therapist' | 'client'
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tenant_id?: string
          role?: 'owner' | 'therapist' | 'client'
          full_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_tenant_id_fkey'
            columns: ['tenant_id']
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
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

// Convenience row types
export type Tenant  = Database['public']['Tables']['tenants']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type UserRole = Profile['role']
