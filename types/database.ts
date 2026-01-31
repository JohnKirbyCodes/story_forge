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
      ai_usage: {
        Row: {
          book_id: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          input_cost_cents: number | null
          input_tokens: number
          model: string
          output_cost_cents: number | null
          output_tokens: number
          project_id: string | null
          request_duration_ms: number | null
          scene_id: string | null
          status: string | null
          total_cost_cents: number | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          input_cost_cents?: number | null
          input_tokens?: number
          model: string
          output_cost_cents?: number | null
          output_tokens?: number
          project_id?: string | null
          request_duration_ms?: number | null
          scene_id?: string | null
          status?: string | null
          total_cost_cents?: number | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          input_cost_cents?: number | null
          input_tokens?: number
          model?: string
          output_cost_cents?: number | null
          output_tokens?: number
          project_id?: string | null
          request_duration_ms?: number | null
          scene_id?: string | null
          status?: string | null
          total_cost_cents?: number | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      book_characters: {
        Row: {
          book_id: string
          created_at: string
          id: string
          introduction_chapter_id: string | null
          is_pov_character: boolean | null
          node_id: string
          role_in_book: string | null
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          introduction_chapter_id?: string | null
          is_pov_character?: boolean | null
          node_id: string
          role_in_book?: string | null
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          introduction_chapter_id?: string | null
          is_pov_character?: boolean | null
          node_id?: string
          role_in_book?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_characters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_characters_introduction_chapter_id_fkey"
            columns: ["introduction_chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_characters_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          content_rating: string | null
          cover_image_url: string | null
          created_at: string
          current_word_count: number | null
          description: string | null
          description_density: string | null
          dialogue_style: string | null
          id: string
          pacing: string | null
          pov_character_ids: string[] | null
          pov_style: string | null
          profanity_level: string | null
          project_id: string
          prose_style: string | null
          romance_level: string | null
          sort_order: number | null
          status: string | null
          subtitle: string | null
          synopsis: string | null
          target_word_count: number | null
          tense: string | null
          title: string
          tone: string[] | null
          updated_at: string
          violence_level: string | null
        }
        Insert: {
          content_rating?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_word_count?: number | null
          description?: string | null
          description_density?: string | null
          dialogue_style?: string | null
          id?: string
          pacing?: string | null
          pov_character_ids?: string[] | null
          pov_style?: string | null
          profanity_level?: string | null
          project_id: string
          prose_style?: string | null
          romance_level?: string | null
          sort_order?: number | null
          status?: string | null
          subtitle?: string | null
          synopsis?: string | null
          target_word_count?: number | null
          tense?: string | null
          title: string
          tone?: string[] | null
          updated_at?: string
          violence_level?: string | null
        }
        Update: {
          content_rating?: string | null
          cover_image_url?: string | null
          created_at?: string
          current_word_count?: number | null
          description?: string | null
          description_density?: string | null
          dialogue_style?: string | null
          id?: string
          pacing?: string | null
          pov_character_ids?: string[] | null
          pov_style?: string | null
          profanity_level?: string | null
          project_id?: string
          prose_style?: string | null
          romance_level?: string | null
          sort_order?: number | null
          status?: string | null
          subtitle?: string | null
          synopsis?: string | null
          target_word_count?: number | null
          tense?: string | null
          title?: string
          tone?: string[] | null
          updated_at?: string
          violence_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "books_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          book_id: string
          created_at: string
          id: string
          order_index: number | null
          part_number: number | null
          part_title: string | null
          sort_order: number | null
          summary: string | null
          target_word_count: number | null
          title: string
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          order_index?: number | null
          part_number?: number | null
          part_title?: string | null
          sort_order?: number | null
          summary?: string | null
          target_word_count?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          order_index?: number | null
          part_number?: number | null
          part_title?: string | null
          sort_order?: number | null
          summary?: string | null
          target_word_count?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_api_key_encrypted: string | null
          ai_api_key_iv: string | null
          ai_api_key_valid: boolean | null
          ai_default_model: string | null
          ai_key_anthropic: string | null
          ai_key_google: string | null
          ai_key_openai: string | null
          ai_key_valid_anthropic: boolean | null
          ai_key_valid_google: boolean | null
          ai_key_valid_openai: boolean | null
          ai_model_edit: string | null
          ai_model_outline: string | null
          ai_model_scene: string | null
          ai_model_synopsis: string | null
          ai_model_universe: string | null
          ai_provider: string | null
          avatar_url: string | null
          billing_cycle: string | null
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_banner_dismissed: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          onboarding_current_step: string | null
          onboarding_skipped_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_period_end: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tooltips_dismissed: string[] | null
          updated_at: string
          words_generated_this_month: number | null
          words_quota: number | null
          words_used_this_month: number | null
        }
        Insert: {
          ai_api_key_encrypted?: string | null
          ai_api_key_iv?: string | null
          ai_api_key_valid?: boolean | null
          ai_default_model?: string | null
          ai_key_anthropic?: string | null
          ai_key_google?: string | null
          ai_key_openai?: string | null
          ai_key_valid_anthropic?: boolean | null
          ai_key_valid_google?: boolean | null
          ai_key_valid_openai?: boolean | null
          ai_model_edit?: string | null
          ai_model_outline?: string | null
          ai_model_scene?: string | null
          ai_model_synopsis?: string | null
          ai_model_universe?: string | null
          ai_provider?: string | null
          avatar_url?: string | null
          billing_cycle?: string | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_banner_dismissed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: string | null
          onboarding_skipped_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tooltips_dismissed?: string[] | null
          updated_at?: string
          words_generated_this_month?: number | null
          words_quota?: number | null
          words_used_this_month?: number | null
        }
        Update: {
          ai_api_key_encrypted?: string | null
          ai_api_key_iv?: string | null
          ai_api_key_valid?: boolean | null
          ai_default_model?: string | null
          ai_key_anthropic?: string | null
          ai_key_google?: string | null
          ai_key_openai?: string | null
          ai_key_valid_anthropic?: boolean | null
          ai_key_valid_google?: boolean | null
          ai_key_valid_openai?: boolean | null
          ai_model_edit?: string | null
          ai_model_outline?: string | null
          ai_model_scene?: string | null
          ai_model_synopsis?: string | null
          ai_model_universe?: string | null
          ai_provider?: string | null
          avatar_url?: string | null
          billing_cycle?: string | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_banner_dismissed?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          onboarding_current_step?: string | null
          onboarding_skipped_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tooltips_dismissed?: string[] | null
          updated_at?: string
          words_generated_this_month?: number | null
          words_quota?: number | null
          words_used_this_month?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          content_rating: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          narrative_conventions: string[] | null
          planned_books: number | null
          series_type: string | null
          subgenres: string[] | null
          target_audience: string | null
          themes: string[] | null
          time_period: string | null
          title: string
          updated_at: string
          user_id: string
          world_description: string | null
          world_setting: string | null
        }
        Insert: {
          content_rating?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          narrative_conventions?: string[] | null
          planned_books?: number | null
          series_type?: string | null
          subgenres?: string[] | null
          target_audience?: string | null
          themes?: string[] | null
          time_period?: string | null
          title: string
          updated_at?: string
          user_id: string
          world_description?: string | null
          world_setting?: string | null
        }
        Update: {
          content_rating?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          narrative_conventions?: string[] | null
          planned_books?: number | null
          series_type?: string | null
          subgenres?: string[] | null
          target_audience?: string | null
          themes?: string[] | null
          time_period?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          world_description?: string | null
          world_setting?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scene_characters: {
        Row: {
          character_id: string
          created_at: string
          id: string
          node_id: string | null
          pov: boolean | null
          role_in_scene: string | null
          scene_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          node_id?: string | null
          pov?: boolean | null
          role_in_scene?: string | null
          scene_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          node_id?: string | null
          pov?: boolean | null
          role_in_scene?: string | null
          scene_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scene_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scene_characters_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      scenes: {
        Row: {
          beat_instructions: string | null
          chapter_id: string
          created_at: string
          edited_prose: string | null
          generated_prose: string | null
          generation_model: string | null
          id: string
          last_generated_at: string | null
          location_id: string | null
          mood: string | null
          order_index: number | null
          pov_character_id: string | null
          scene_type: string | null
          sort_order: number | null
          target_word_count: number | null
          tension_level: string | null
          time_in_story: string | null
          time_of_day: string | null
          title: string | null
          updated_at: string
          weather: string | null
          word_count: number | null
        }
        Insert: {
          beat_instructions?: string | null
          chapter_id: string
          created_at?: string
          edited_prose?: string | null
          generated_prose?: string | null
          generation_model?: string | null
          id?: string
          last_generated_at?: string | null
          location_id?: string | null
          mood?: string | null
          order_index?: number | null
          pov_character_id?: string | null
          scene_type?: string | null
          sort_order?: number | null
          target_word_count?: number | null
          tension_level?: string | null
          time_in_story?: string | null
          time_of_day?: string | null
          title?: string | null
          updated_at?: string
          weather?: string | null
          word_count?: number | null
        }
        Update: {
          beat_instructions?: string | null
          chapter_id?: string
          created_at?: string
          edited_prose?: string | null
          generated_prose?: string | null
          generation_model?: string | null
          id?: string
          last_generated_at?: string | null
          location_id?: string | null
          mood?: string | null
          order_index?: number | null
          pov_character_id?: string | null
          scene_type?: string | null
          sort_order?: number | null
          target_word_count?: number | null
          tension_level?: string | null
          time_in_story?: string | null
          time_of_day?: string | null
          title?: string | null
          updated_at?: string
          weather?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenes_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_location_fk"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenes_pov_character_fk"
            columns: ["pov_character_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      story_edges: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_bidirectional: boolean | null
          label: string | null
          project_id: string
          relationship_type: string
          source_node_id: string
          target_node_id: string
          updated_at: string
          valid_from_book_id: string | null
          valid_until_book_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_bidirectional?: boolean | null
          label?: string | null
          project_id: string
          relationship_type: string
          source_node_id: string
          target_node_id: string
          updated_at?: string
          valid_from_book_id?: string | null
          valid_until_book_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_bidirectional?: boolean | null
          label?: string | null
          project_id?: string
          relationship_type?: string
          source_node_id?: string
          target_node_id?: string
          updated_at?: string
          valid_from_book_id?: string | null
          valid_until_book_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "story_edges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_edges_valid_from_book_id_fkey"
            columns: ["valid_from_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_edges_valid_until_book_id_fkey"
            columns: ["valid_until_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      story_nodes: {
        Row: {
          attributes: Json | null
          character_arc: string | null
          character_role: string | null
          created_at: string
          description: string | null
          embedding: string | null
          event_date: string | null
          id: string
          image_url: string | null
          location_type: string | null
          name: string
          node_type: Database["public"]["Enums"]["node_type"]
          notes: string | null
          position_x: number | null
          position_y: number | null
          project_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          character_arc?: string | null
          character_role?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location_type?: string | null
          name: string
          node_type: Database["public"]["Enums"]["node_type"]
          notes?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          character_arc?: string | null
          character_role?: string | null
          created_at?: string
          description?: string | null
          embedding?: string | null
          event_date?: string | null
          id?: string
          image_url?: string | null
          location_type?: string | null
          name?: string
          node_type?: Database["public"]["Enums"]["node_type"]
          notes?: string | null
          position_x?: number | null
          position_y?: number | null
          project_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_nodes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_ai_usage_summary: {
        Row: {
          endpoint: string | null
          model: string | null
          month: string | null
          total_cost_usd: number | null
          total_input_tokens: number | null
          total_output_tokens: number | null
          total_requests: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_and_reset_billing_period: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_connected_subgraph: {
        Args: {
          p_current_book_id?: string
          p_depth?: number
          p_focus_node_ids: string[]
          p_project_id: string
        }
        Returns: {
          connected_to: string
          depth: number
          edge_description: string
          edge_id: string
          edge_is_bidirectional: boolean
          edge_label: string
          edge_type: string
          edge_weight: number
          node_attributes: Json
          node_character_arc: string
          node_character_role: string
          node_description: string
          node_event_date: string
          node_id: string
          node_location_type: string
          node_name: string
          node_tags: string[]
          node_type: Database["public"]["Enums"]["node_type"]
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_word_usage: {
        Args: { user_id: string; word_count: number }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      reset_monthly_word_usage: {
        Args: { user_id: string }
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      node_type:
        | "character"
        | "location"
        | "item"
        | "event"
        | "faction"
        | "concept"
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
      node_type: [
        "character",
        "location",
        "item",
        "event",
        "faction",
        "concept",
      ],
    },
  },
} as const


// Convenience type exports
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Scene = Database["public"]["Tables"]["scenes"]["Row"];
export type SceneCharacter = Database["public"]["Tables"]["scene_characters"]["Row"];
export type StoryNode = Database["public"]["Tables"]["story_nodes"]["Row"];
export type StoryEdge = Database["public"]["Tables"]["story_edges"]["Row"];
export type Book = Database["public"]["Tables"]["books"]["Row"];
export type Chapter = Database["public"]["Tables"]["chapters"]["Row"];
export type BookCharacter = Database["public"]["Tables"]["book_characters"]["Row"];
export type NodeType = Database["public"]["Enums"]["node_type"];
