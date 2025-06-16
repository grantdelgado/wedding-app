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
      communication_preferences: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          receive_email: boolean | null
          receive_push: boolean | null
          receive_sms: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          receive_email?: boolean | null
          receive_push?: boolean | null
          receive_sms?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          receive_email?: boolean | null
          receive_push?: boolean | null
          receive_sms?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_preferences_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_guests: {
        Row: {
          created_at: string | null
          event_id: string
          guest_email: string | null
          guest_name: string | null
          guest_tags: string[] | null
          id: string
          invited_at: string | null
          notes: string | null
          phone: string
          phone_number_verified: boolean | null
          preferred_communication: string | null
          role: string
          rsvp_status: string | null
          sms_opt_out: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          guest_tags?: string[] | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          phone: string
          phone_number_verified?: boolean | null
          preferred_communication?: string | null
          role?: string
          rsvp_status?: string | null
          sms_opt_out?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          guest_tags?: string[] | null
          id?: string
          invited_at?: string | null
          notes?: string | null
          phone?: string
          phone_number_verified?: boolean | null
          preferred_communication?: string | null
          role?: string
          rsvp_status?: string | null
          sms_opt_out?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          invited_at: string | null
          notes: string | null
          role: string
          rsvp_status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          role?: string
          rsvp_status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          invited_at?: string | null
          notes?: string | null
          role?: string
          rsvp_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_new"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          header_image_url: string | null
          host_user_id: string
          id: string
          is_public: boolean | null
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          header_image_url?: string | null
          host_user_id: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          header_image_url?: string | null
          host_user_id?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events_new: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          header_image_url: string | null
          host_user_id: string
          id: string
          is_public: boolean | null
          location: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          header_image_url?: string | null
          host_user_id: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          header_image_url?: string | null
          host_user_id?: string
          id?: string
          is_public?: boolean | null
          location?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_new_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_new_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users_new"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_sub_event_assignments: {
        Row: {
          created_at: string | null
          guest_id: string
          id: string
          is_invited: boolean | null
          rsvp_status: string | null
          sub_event_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id: string
          id?: string
          is_invited?: boolean | null
          rsvp_status?: string | null
          sub_event_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string
          id?: string
          is_invited?: boolean | null
          rsvp_status?: string | null
          sub_event_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_sub_event_assignments_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "event_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_sub_event_assignments_sub_event_id_fkey"
            columns: ["sub_event_id"]
            isOneToOne: false
            referencedRelation: "sub_events"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          caption: string | null
          created_at: string | null
          event_id: string
          id: string
          is_featured: boolean | null
          media_tags: string[] | null
          media_type: string
          storage_path: string
          updated_at: string | null
          uploader_user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          is_featured?: boolean | null
          media_tags?: string[] | null
          media_type: string
          storage_path: string
          updated_at?: string | null
          uploader_user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_featured?: boolean | null
          media_tags?: string[] | null
          media_type?: string
          storage_path?: string
          updated_at?: string | null
          uploader_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploader_user_id_fkey"
            columns: ["uploader_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_new: {
        Row: {
          caption: string | null
          created_at: string | null
          event_id: string
          id: string
          media_type: string
          storage_path: string
          uploader_user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          media_type: string
          storage_path: string
          uploader_user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          media_type?: string
          storage_path?: string
          uploader_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_new_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_new_uploader_user_id_fkey"
            columns: ["uploader_user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_new_uploader_user_id_fkey"
            columns: ["uploader_user_id"]
            isOneToOne: false
            referencedRelation: "users_new"
            referencedColumns: ["id"]
          },
        ]
      }
      message_deliveries: {
        Row: {
          created_at: string | null
          email: string | null
          email_provider_id: string | null
          email_status: string | null
          guest_id: string
          has_responded: boolean | null
          id: string
          message_id: string | null
          phone_number: string | null
          push_provider_id: string | null
          push_status: string | null
          response_message_id: string | null
          scheduled_message_id: string | null
          sms_provider_id: string | null
          sms_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          email_provider_id?: string | null
          email_status?: string | null
          guest_id: string
          has_responded?: boolean | null
          id?: string
          message_id?: string | null
          phone_number?: string | null
          push_provider_id?: string | null
          push_status?: string | null
          response_message_id?: string | null
          scheduled_message_id?: string | null
          sms_provider_id?: string | null
          sms_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          email_provider_id?: string | null
          email_status?: string | null
          guest_id?: string
          has_responded?: boolean | null
          id?: string
          message_id?: string | null
          phone_number?: string | null
          push_provider_id?: string | null
          push_status?: string | null
          response_message_id?: string | null
          scheduled_message_id?: string | null
          sms_provider_id?: string | null
          sms_status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_deliveries_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "event_guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_deliveries_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_deliveries_response_message_id_fkey"
            columns: ["response_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_deliveries_scheduled_message_id_fkey"
            columns: ["scheduled_message_id"]
            isOneToOne: false
            referencedRelation: "scheduled_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          id: string
          message_type: string | null
          parent_message_id: string | null
          recipient_tags: string[] | null
          recipient_user_id: string | null
          sender_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          message_type?: string | null
          parent_message_id?: string | null
          recipient_tags?: string[] | null
          recipient_user_id?: string | null
          sender_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          message_type?: string | null
          parent_message_id?: string | null
          recipient_tags?: string[] | null
          recipient_user_id?: string | null
          sender_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_new: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          id: string
          message_type: string | null
          sender_user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          id?: string
          message_type?: string | null
          sender_user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          id?: string
          message_type?: string | null
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_new_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_new"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_new_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "public_user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_new_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users_new"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          content: string
          created_at: string | null
          event_id: string
          failure_count: number | null
          id: string
          recipient_count: number | null
          send_at: string
          send_via_email: boolean | null
          send_via_push: boolean | null
          send_via_sms: boolean | null
          sender_user_id: string
          sent_at: string | null
          status: string | null
          subject: string | null
          success_count: number | null
          target_all_guests: boolean | null
          target_guest_ids: string[] | null
          target_guest_tags: string[] | null
          target_sub_event_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          event_id: string
          failure_count?: number | null
          id?: string
          recipient_count?: number | null
          send_at: string
          send_via_email?: boolean | null
          send_via_push?: boolean | null
          send_via_sms?: boolean | null
          sender_user_id: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          success_count?: number | null
          target_all_guests?: boolean | null
          target_guest_ids?: string[] | null
          target_guest_tags?: string[] | null
          target_sub_event_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          event_id?: string
          failure_count?: number | null
          id?: string
          recipient_count?: number | null
          send_at?: string
          send_via_email?: boolean | null
          send_via_push?: boolean | null
          send_via_sms?: boolean | null
          sender_user_id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          success_count?: number | null
          target_all_guests?: boolean | null
          target_guest_ids?: string[] | null
          target_guest_tags?: string[] | null
          target_sub_event_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string | null
          event_id: string
          id: string
          is_required: boolean | null
          location: string | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_id: string
          id?: string
          is_required?: boolean | null
          location?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          event_id?: string
          id?: string
          is_required?: boolean | null
          location?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users_new: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_user_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_event: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      can_view_user_profile: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_ready_scheduled_messages: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          event_id: string
          content: string
          target_guest_count: number
        }[]
      }
      get_sub_event_guests: {
        Args: { p_sub_event_id: string }
        Returns: {
          guest_id: string
          guest_name: string
          guest_email: string
          phone_number: string
          rsvp_status: string
        }[]
      }
      get_user_event_role: {
        Args: { p_event_id: string }
        Returns: string
      }
      get_user_events: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_id: string
          title: string
          event_date: string
          location: string
          user_role: string
          rsvp_status: string
          is_primary_host: boolean
        }[]
      }
      is_development_phone: {
        Args: { p_phone: string }
        Returns: boolean
      }
      is_event_host: {
        Args: { p_event_id: string }
        Returns: boolean
      }
    }
    Enums: {
      media_type_enum: "image" | "video"
      message_type_enum: "direct" | "announcement" | "channel"
      rsvp_status_enum: "attending" | "declined" | "maybe" | "pending"
      user_role_enum: "guest" | "host" | "admin"
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
    Enums: {
      media_type_enum: ["image", "video"],
      message_type_enum: ["direct", "announcement", "channel"],
      rsvp_status_enum: ["attending", "declined", "maybe", "pending"],
      user_role_enum: ["guest", "host", "admin"],
    },
  },
} as const

