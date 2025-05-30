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
      data_sync_log: {
        Row: {
          created_at: string
          error_details: Json | null
          errors_count: number | null
          id: string
          members_processed: number | null
          parties_processed: number | null
          status: string
          sync_duration_ms: number | null
          sync_type: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          members_processed?: number | null
          parties_processed?: number | null
          status: string
          sync_duration_ms?: number | null
          sync_type: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          members_processed?: number | null
          parties_processed?: number | null
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
        }
        Relationships: []
      }
      member_data: {
        Row: {
          activity_data: Json | null
          assignments: Json | null
          birth_year: number | null
          committee_assignments: Json | null
          constituency: string | null
          created_at: string
          current_committees: string[] | null
          first_name: string
          gender: string | null
          id: string
          image_urls: Json | null
          is_active: boolean | null
          last_name: string
          member_id: string
          party: string
          riksdag_status: string | null
          updated_at: string
        }
        Insert: {
          activity_data?: Json | null
          assignments?: Json | null
          birth_year?: number | null
          committee_assignments?: Json | null
          constituency?: string | null
          created_at?: string
          current_committees?: string[] | null
          first_name: string
          gender?: string | null
          id?: string
          image_urls?: Json | null
          is_active?: boolean | null
          last_name: string
          member_id: string
          party: string
          riksdag_status?: string | null
          updated_at?: string
        }
        Update: {
          activity_data?: Json | null
          assignments?: Json | null
          birth_year?: number | null
          committee_assignments?: Json | null
          constituency?: string | null
          created_at?: string
          current_committees?: string[] | null
          first_name?: string
          gender?: string | null
          id?: string
          image_urls?: Json | null
          is_active?: boolean | null
          last_name?: string
          member_id?: string
          party?: string
          riksdag_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      party_data: {
        Row: {
          active_members: number
          activity_stats: Json | null
          age_distribution: Json | null
          committee_distribution: Json | null
          committee_members: Json | null
          created_at: string
          gender_distribution: Json | null
          id: string
          member_list: Json | null
          party_code: string
          party_name: string
          total_members: number
          updated_at: string
        }
        Insert: {
          active_members?: number
          activity_stats?: Json | null
          age_distribution?: Json | null
          committee_distribution?: Json | null
          committee_members?: Json | null
          created_at?: string
          gender_distribution?: Json | null
          id?: string
          member_list?: Json | null
          party_code: string
          party_name: string
          total_members?: number
          updated_at?: string
        }
        Update: {
          active_members?: number
          activity_stats?: Json | null
          age_distribution?: Json | null
          committee_distribution?: Json | null
          committee_members?: Json | null
          created_at?: string
          gender_distribution?: Json | null
          id?: string
          member_list?: Json | null
          party_code?: string
          party_name?: string
          total_members?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
