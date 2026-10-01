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
      announcement_likes: {
        Row: {
          announcement_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_likes_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean
          button_label: string | null
          button_url: string | null
          button2_label: string | null
          button2_url: string | null
          created_at: string
          description: string
          id: string
          image_url: string
          sort_order: number
          sponsor_name: string
          type: string
        }
        Insert: {
          active?: boolean
          button_label?: string | null
          button_url?: string | null
          button2_label?: string | null
          button2_url?: string | null
          created_at?: string
          description: string
          id?: string
          image_url: string
          sort_order?: number
          sponsor_name: string
          type?: string
        }
        Update: {
          active?: boolean
          button_label?: string | null
          button_url?: string | null
          button2_label?: string | null
          button2_url?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          sort_order?: number
          sponsor_name?: string
          type?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: boolean
          submissions_blocked: boolean
          updated_at: string
        }
        Insert: {
          id?: boolean
          submissions_blocked?: boolean
          updated_at?: string
        }
        Update: {
          id?: boolean
          submissions_blocked?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      identity_verifications: {
        Row: {
          back_url: string
          created_at: string
          front_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          selfie_url: string
          status: string
          user_id: string
        }
        Insert: {
          back_url: string
          created_at?: string
          front_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url: string
          status?: string
          user_id: string
        }
        Update: {
          back_url?: string
          created_at?: string
          front_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      merchant_deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          proof_url: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          proof_url: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          proof_url?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      merchant_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          message: string
          source: string
          submission_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          message: string
          source?: string
          submission_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          message?: string
          source?: string
          submission_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      password_resets: {
        Row: {
          attempts: number
          code_hash: string | null
          created_at: string
          id: string
          issued_at: string | null
          phone: string
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash?: string | null
          created_at?: string
          id?: string
          issued_at?: string | null
          phone: string
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string | null
          created_at?: string
          id?: string
          issued_at?: string | null
          phone?: string
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alternate_phone: string | null
          avatar_url: string | null
          balance: number
          created_at: string
          full_name: string
          id: string
          merchant_balance: number
          phone: string
          rating: number
          starred: boolean
          user_id: string
        }
        Insert: {
          alternate_phone?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name: string
          id?: string
          merchant_balance?: number
          phone: string
          rating?: number
          starred?: boolean
          user_id: string
        }
        Update: {
          alternate_phone?: string | null
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name?: string
          id?: string
          merchant_balance?: number
          phone?: string
          rating?: number
          starred?: boolean
          user_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          note: string | null
          reference: string | null
          review_note: string | null
          service: string
          service_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          reference?: string | null
          review_note?: string | null
          service: string
          service_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          note?: string | null
          reference?: string | null
          review_note?: string | null
          service?: string
          service_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      task_submissions: {
        Row: {
          answer_text: string | null
          created_at: string
          evidence_url: string | null
          id: string
          review_note: string | null
          reviewed_at: string | null
          status: string
          task_id: string
          user_id: string
        }
        Insert: {
          answer_text?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
          task_id: string
          user_id: string
        }
        Update: {
          answer_text?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          status?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          active: boolean
          category: string
          complexity: string
          created_at: string
          currency: string
          description: string
          estimated_minutes: number
          id: string
          instructions: string[]
          merchant_id: string | null
          proof_type: string
          reward: number
          slots: number
          title: string
        }
        Insert: {
          active?: boolean
          category?: string
          complexity?: string
          created_at?: string
          currency?: string
          description: string
          estimated_minutes?: number
          id?: string
          instructions?: string[]
          merchant_id?: string | null
          proof_type?: string
          reward: number
          slots?: number
          title: string
        }
        Update: {
          active?: boolean
          category?: string
          complexity?: string
          created_at?: string
          currency?: string
          description?: string
          estimated_minutes?: number
          id?: string
          instructions?: string[]
          merchant_id?: string | null
          proof_type?: string
          reward?: number
          slots?: number
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          destination: string | null
          id: string
          method: string
          paid_at: string | null
          rejection_reason: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          destination?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          rejection_reason?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          destination?: string | null
          id?: string
          method?: string
          paid_at?: string | null
          rejection_reason?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_submission_with_payment: {
        Args: { _amount: number; _submission_id: string }
        Returns: undefined
      }
      consume_password_reset: {
        Args: { _code: string; _phone: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_password_reset_code: {
        Args: { _request_id: string }
        Returns: string
      }
      mark_withdrawal_paid: {
        Args: { _withdrawal_id: string }
        Returns: undefined
      }
      publish_merchant_task: {
        Args: {
          _category: string
          _complexity?: string
          _currency?: string
          _description: string
          _instructions: string[]
          _proof_type: string
          _reward: number
          _slots: number
          _title: string
        }
        Returns: string
      }
      update_merchant_task: {
        Args: {
          _category: string
          _complexity?: string
          _currency?: string
          _description: string
          _instructions: string[]
          _proof_type: string
          _task_id: string
          _title: string
        }
        Returns: undefined
      }
      reject_withdrawal: {
        Args: { _reason: string; _withdrawal_id: string }
        Returns: undefined
      }
      request_password_reset: { Args: { _phone: string }; Returns: undefined }
      request_withdrawal: {
        Args: { _amount: number; _destination?: string; _method?: string }
        Returns: string
      }
      review_merchant_deposit: {
        Args: { _approve: boolean; _deposit_id: string; _reason?: string }
        Returns: undefined
      }
      review_task_submission: {
        Args: {
          _approve: boolean
          _review_note?: string
          _submission_id: string
        }
        Returns: undefined
      }
      set_merchant_task_active: {
        Args: { _active: boolean; _task_id: string }
        Returns: undefined
      }
      transfer_to_merchant: { Args: { _amount: number }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
