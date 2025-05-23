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
      events: {
        Row: {
          created_at: string | null
          date: string
          header_image: string | null
          host_id: string | null
          id: string
          location: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          date: string
          header_image?: string | null
          host_id?: string | null
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          date?: string
          header_image?: string | null
          host_id?: string | null
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          event_id: string | null
          full_name: string | null
          id: string
          phone: string | null
          rsvp_status: string | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          rsvp_status?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          rsvp_status?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string | null
          id: string
          is_featured: boolean | null
          tags: string[] | null
          type: string | null
          uploader_id: string | null
          url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          type?: string | null
          uploader_id?: string | null
          url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_featured?: boolean | null
          tags?: string[] | null
          type?: string | null
          uploader_id?: string | null
          url?: string | null
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
            foreignKeyName: "media_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          event_id: string | null
          id: string
          recipient_id: string | null
          sender_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          recipient_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          recipient_id?: string | null
          sender_id?: string | null
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
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
  }
}
