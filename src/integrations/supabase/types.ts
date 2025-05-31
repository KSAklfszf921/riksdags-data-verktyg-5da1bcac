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
      batch_progress: {
        Row: {
          created_at: string
          current_batch_rss_items: number
          current_member_index: number
          current_member_name: string | null
          errors: Json | null
          estimated_completion: string | null
          failed_fetches: number
          id: string
          member_list: Json | null
          processed_members: number
          session_id: string
          start_time: string | null
          status: string
          successful_fetches: number
          total_members: number
          total_rss_items: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_batch_rss_items?: number
          current_member_index?: number
          current_member_name?: string | null
          errors?: Json | null
          estimated_completion?: string | null
          failed_fetches?: number
          id?: string
          member_list?: Json | null
          processed_members?: number
          session_id: string
          start_time?: string | null
          status?: string
          successful_fetches?: number
          total_members?: number
          total_rss_items?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_batch_rss_items?: number
          current_member_index?: number
          current_member_name?: string | null
          errors?: Json | null
          estimated_completion?: string | null
          failed_fetches?: number
          id?: string
          member_list?: Json | null
          processed_members?: number
          session_id?: string
          start_time?: string | null
          status?: string
          successful_fetches?: number
          total_members?: number
          total_rss_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      calendar_data: {
        Row: {
          aktivitet: string | null
          created_at: string
          datum: string | null
          description: string | null
          event_id: string
          id: string
          metadata: Json | null
          organ: string | null
          participants: Json | null
          plats: string | null
          related_documents: Json | null
          sekretess: string | null
          status: string | null
          summary: string | null
          tid: string | null
          typ: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          aktivitet?: string | null
          created_at?: string
          datum?: string | null
          description?: string | null
          event_id: string
          id?: string
          metadata?: Json | null
          organ?: string | null
          participants?: Json | null
          plats?: string | null
          related_documents?: Json | null
          sekretess?: string | null
          status?: string | null
          summary?: string | null
          tid?: string | null
          typ?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          aktivitet?: string | null
          created_at?: string
          datum?: string | null
          description?: string | null
          event_id?: string
          id?: string
          metadata?: Json | null
          organ?: string | null
          participants?: Json | null
          plats?: string | null
          related_documents?: Json | null
          sekretess?: string | null
          status?: string | null
          summary?: string | null
          tid?: string | null
          typ?: string | null
          updated_at?: string
          url?: string | null
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
          id: string
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
          id?: string
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
          id?: string
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
          id: string
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
          id?: string
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
          id?: string
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
      language_analysis: {
        Row: {
          analysis_date: string
          analysis_version: string
          avg_sentence_length: number | null
          avg_word_length: number | null
          complex_words_ratio: number | null
          created_at: string
          document_id: string
          document_title: string | null
          document_type: string
          exclamation_count: number
          formal_language_indicators: number
          full_text: string | null
          id: string
          language_complexity_score: number
          member_id: string
          member_name: string
          overall_score: number
          paragraph_count: number
          passive_voice_ratio: number | null
          question_count: number
          rhetorical_elements_score: number
          sentence_count: number
          structural_clarity_score: number
          technical_terms_count: number
          unique_words_ratio: number | null
          updated_at: string
          vocabulary_richness_score: number
          word_count: number
        }
        Insert: {
          analysis_date?: string
          analysis_version?: string
          avg_sentence_length?: number | null
          avg_word_length?: number | null
          complex_words_ratio?: number | null
          created_at?: string
          document_id: string
          document_title?: string | null
          document_type: string
          exclamation_count?: number
          formal_language_indicators?: number
          full_text?: string | null
          id?: string
          language_complexity_score: number
          member_id: string
          member_name: string
          overall_score: number
          paragraph_count?: number
          passive_voice_ratio?: number | null
          question_count?: number
          rhetorical_elements_score: number
          sentence_count?: number
          structural_clarity_score: number
          technical_terms_count?: number
          unique_words_ratio?: number | null
          updated_at?: string
          vocabulary_richness_score: number
          word_count?: number
        }
        Update: {
          analysis_date?: string
          analysis_version?: string
          avg_sentence_length?: number | null
          avg_word_length?: number | null
          complex_words_ratio?: number | null
          created_at?: string
          document_id?: string
          document_title?: string | null
          document_type?: string
          exclamation_count?: number
          formal_language_indicators?: number
          full_text?: string | null
          id?: string
          language_complexity_score?: number
          member_id?: string
          member_name?: string
          overall_score?: number
          paragraph_count?: number
          passive_voice_ratio?: number | null
          question_count?: number
          rhetorical_elements_score?: number
          sentence_count?: number
          structural_clarity_score?: number
          technical_terms_count?: number
          unique_words_ratio?: number | null
          updated_at?: string
          vocabulary_richness_score?: number
          word_count?: number
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
      member_news: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          link: string
          member_id: string
          member_name: string
          pub_date: string
          source: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link: string
          member_id: string
          member_name: string
          pub_date: string
          source?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link?: string
          member_id?: string
          member_name?: string
          pub_date?: string
          source?: string | null
          title?: string
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
      speech_data: {
        Row: {
          anf_klockslag: string | null
          anforande_id: string | null
          anforande_nummer: string | null
          anforande_url_html: string | null
          anforandedatum: string | null
          anforandetext: string | null
          anforandetyp: string | null
          content_summary: string | null
          created_at: string
          id: string
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
          anforande_nummer?: string | null
          anforande_url_html?: string | null
          anforandedatum?: string | null
          anforandetext?: string | null
          anforandetyp?: string | null
          content_summary?: string | null
          created_at?: string
          id?: string
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
          anforande_nummer?: string | null
          anforande_url_html?: string | null
          anforandedatum?: string | null
          anforandetext?: string | null
          anforandetyp?: string | null
          content_summary?: string | null
          created_at?: string
          id?: string
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
          id: string
          party_breakdown: Json | null
          punkt: string | null
          rm: string | null
          systemdatum: string | null
          updated_at: string
          vote_id: string
          vote_results: Json | null
          vote_statistics: Json | null
          votering: string | null
        }
        Insert: {
          avser?: string | null
          beteckning?: string | null
          constituency_breakdown?: Json | null
          created_at?: string
          dok_id?: string | null
          hangar_id?: string | null
          id?: string
          party_breakdown?: Json | null
          punkt?: string | null
          rm?: string | null
          systemdatum?: string | null
          updated_at?: string
          vote_id: string
          vote_results?: Json | null
          vote_statistics?: Json | null
          votering?: string | null
        }
        Update: {
          avser?: string | null
          beteckning?: string | null
          constituency_breakdown?: Json | null
          created_at?: string
          dok_id?: string | null
          hangar_id?: string | null
          id?: string
          party_breakdown?: Json | null
          punkt?: string | null
          rm?: string | null
          systemdatum?: string | null
          updated_at?: string
          vote_id?: string
          vote_results?: Json | null
          vote_statistics?: Json | null
          votering?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
