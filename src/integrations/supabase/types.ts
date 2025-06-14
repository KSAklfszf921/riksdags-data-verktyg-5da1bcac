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
      calendar_data: {
        Row: {
          agenda_items: Json | null
          created_at: string
          datum: string
          description: string | null
          end_time: string | null
          event_id: string
          id: number
          location: string | null
          metadata: Json | null
          organ: string | null
          participants: Json | null
          start_time: string | null
          summary: string | null
          typ: string | null
          updated_at: string
        }
        Insert: {
          agenda_items?: Json | null
          created_at?: string
          datum: string
          description?: string | null
          end_time?: string | null
          event_id: string
          id?: never
          location?: string | null
          metadata?: Json | null
          organ?: string | null
          participants?: Json | null
          start_time?: string | null
          summary?: string | null
          typ?: string | null
          updated_at?: string
        }
        Update: {
          agenda_items?: Json | null
          created_at?: string
          datum?: string
          description?: string | null
          end_time?: string | null
          event_id?: string
          id?: never
          location?: string | null
          metadata?: Json | null
          organ?: string | null
          participants?: Json | null
          start_time?: string | null
          summary?: string | null
          typ?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      data_sync_log: {
        Row: {
          calendar_events_processed: number | null
          created_at: string
          documents_processed: number | null
          error_details: Json | null
          errors_count: number | null
          id: number
          members_processed: number | null
          parties_processed: number | null
          speeches_processed: number | null
          status: string
          sync_duration_ms: number | null
          sync_type: string
          votes_processed: number | null
        }
        Insert: {
          calendar_events_processed?: number | null
          created_at?: string
          documents_processed?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: never
          members_processed?: number | null
          parties_processed?: number | null
          speeches_processed?: number | null
          status: string
          sync_duration_ms?: number | null
          sync_type: string
          votes_processed?: number | null
        }
        Update: {
          calendar_events_processed?: number | null
          created_at?: string
          documents_processed?: number | null
          error_details?: Json | null
          errors_count?: number | null
          id?: never
          members_processed?: number | null
          parties_processed?: number | null
          speeches_processed?: number | null
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
          votes_processed?: number | null
        }
        Relationships: []
      }
      document_data: {
        Row: {
          beteckning: string | null
          content_preview: string | null
          created_at: string
          datum: string | null
          document_id: string
          document_url_html: string | null
          document_url_text: string | null
          dokumentstatus: string | null
          hangar_id: string | null
          id: number
          intressent_id: string | null
          metadata: Json | null
          organ: string | null
          party: string | null
          publicerad: string | null
          rm: string | null
          summary: string | null
          titel: string | null
          typ: string | null
          updated_at: string
        }
        Insert: {
          beteckning?: string | null
          content_preview?: string | null
          created_at?: string
          datum?: string | null
          document_id: string
          document_url_html?: string | null
          document_url_text?: string | null
          dokumentstatus?: string | null
          hangar_id?: string | null
          id?: never
          intressent_id?: string | null
          metadata?: Json | null
          organ?: string | null
          party?: string | null
          publicerad?: string | null
          rm?: string | null
          summary?: string | null
          titel?: string | null
          typ?: string | null
          updated_at?: string
        }
        Update: {
          beteckning?: string | null
          content_preview?: string | null
          created_at?: string
          datum?: string | null
          document_id?: string
          document_url_html?: string | null
          document_url_text?: string | null
          dokumentstatus?: string | null
          hangar_id?: string | null
          id?: never
          intressent_id?: string | null
          metadata?: Json | null
          organ?: string | null
          party?: string | null
          publicerad?: string | null
          rm?: string | null
          summary?: string | null
          titel?: string | null
          typ?: string | null
          updated_at?: string
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
          id: number
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
          id?: never
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
          id?: never
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
          active_members: number | null
          activity_stats: Json | null
          age_distribution: Json | null
          committee_distribution: Json | null
          committee_members: Json | null
          created_at: string
          gender_distribution: Json | null
          id: number
          member_list: Json | null
          party_code: string
          party_name: string
          total_members: number | null
          updated_at: string
        }
        Insert: {
          active_members?: number | null
          activity_stats?: Json | null
          age_distribution?: Json | null
          committee_distribution?: Json | null
          committee_members?: Json | null
          created_at?: string
          gender_distribution?: Json | null
          id?: never
          member_list?: Json | null
          party_code: string
          party_name: string
          total_members?: number | null
          updated_at?: string
        }
        Update: {
          active_members?: number | null
          activity_stats?: Json | null
          age_distribution?: Json | null
          committee_distribution?: Json | null
          committee_members?: Json | null
          created_at?: string
          gender_distribution?: Json | null
          id?: never
          member_list?: Json | null
          party_code?: string
          party_name?: string
          total_members?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      speech_data: {
        Row: {
          anf_klockslag: string | null
          anforande_id: string | null
          anforande_nummer: number | null
          anforande_url_html: string | null
          anforandedatum: string | null
          anforandetext: string | null
          anforandetyp: string | null
          content_summary: string | null
          created_at: string
          id: number
          intressent_id: string | null
          kammaraktivitet: string | null
          metadata: Json | null
          namn: string | null
          party: string | null
          rel_dok_beteckning: string | null
          rel_dok_id: string | null
          rel_dok_titel: string | null
          speech_id: string
          talare: string | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          anf_klockslag?: string | null
          anforande_id?: string | null
          anforande_nummer?: number | null
          anforande_url_html?: string | null
          anforandedatum?: string | null
          anforandetext?: string | null
          anforandetyp?: string | null
          content_summary?: string | null
          created_at?: string
          id?: never
          intressent_id?: string | null
          kammaraktivitet?: string | null
          metadata?: Json | null
          namn?: string | null
          party?: string | null
          rel_dok_beteckning?: string | null
          rel_dok_id?: string | null
          rel_dok_titel?: string | null
          speech_id: string
          talare?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          anf_klockslag?: string | null
          anforande_id?: string | null
          anforande_nummer?: number | null
          anforande_url_html?: string | null
          anforandedatum?: string | null
          anforandetext?: string | null
          anforandetyp?: string | null
          content_summary?: string | null
          created_at?: string
          id?: never
          intressent_id?: string | null
          kammaraktivitet?: string | null
          metadata?: Json | null
          namn?: string | null
          party?: string | null
          rel_dok_beteckning?: string | null
          rel_dok_id?: string | null
          rel_dok_titel?: string | null
          speech_id?: string
          talare?: string | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: []
      }
      vote_data: {
        Row: {
          avser: string | null
          beteckning: string | null
          constituency_breakdown: Json | null
          created_at: string
          dok_id: string | null
          hangar_id: string | null
          id: number
          metadata: Json | null
          party_breakdown: Json | null
          punkt: number | null
          rm: string | null
          systemdatum: string | null
          updated_at: string
          vote_id: string
          vote_results: Json | null
          votering: string | null
        }
        Insert: {
          avser?: string | null
          beteckning?: string | null
          constituency_breakdown?: Json | null
          created_at?: string
          dok_id?: string | null
          hangar_id?: string | null
          id?: never
          metadata?: Json | null
          party_breakdown?: Json | null
          punkt?: number | null
          rm?: string | null
          systemdatum?: string | null
          updated_at?: string
          vote_id: string
          vote_results?: Json | null
          votering?: string | null
        }
        Update: {
          avser?: string | null
          beteckning?: string | null
          constituency_breakdown?: Json | null
          created_at?: string
          dok_id?: string | null
          hangar_id?: string | null
          id?: never
          metadata?: Json | null
          party_breakdown?: Json | null
          punkt?: number | null
          rm?: string | null
          systemdatum?: string | null
          updated_at?: string
          vote_id?: string
          vote_results?: Json | null
          votering?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args:
          | { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
          | { user_id: number; role_name: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { _user_id?: string }
        Returns: boolean
      }
      migrate_to_enhanced_member_profiles: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_member_active_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
