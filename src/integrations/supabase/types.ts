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
      admin_audit_log: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          metadata: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      agendamentos: {
        Row: {
          cliente_id: string
          created_at: string
          fim: string
          google_event_id: string | null
          id: string
          inicio: string
          lembrete_enviado_em: string | null
          observacoes: string | null
          pagamento_id: string | null
          pagamento_link: string | null
          pagamento_status: string
          preco: number
          profissional_id: string
          servico_id: string
          status: Database["public"]["Enums"]["agendamento_status"]
          tenant_id: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          fim: string
          google_event_id?: string | null
          id?: string
          inicio: string
          lembrete_enviado_em?: string | null
          observacoes?: string | null
          pagamento_id?: string | null
          pagamento_link?: string | null
          pagamento_status?: string
          preco?: number
          profissional_id: string
          servico_id: string
          status?: Database["public"]["Enums"]["agendamento_status"]
          tenant_id: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          fim?: string
          google_event_id?: string | null
          id?: string
          inicio?: string
          lembrete_enviado_em?: string | null
          observacoes?: string | null
          pagamento_id?: string | null
          pagamento_link?: string | null
          pagamento_status?: string
          preco?: number
          profissional_id?: string
          servico_id?: string
          status?: Database["public"]["Enums"]["agendamento_status"]
          tenant_id?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          data_nascimento: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_tokens: {
        Row: {
          access_token: string
          calendar_id: string | null
          created_at: string
          expiry: string
          refresh_token: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          created_at?: string
          expiry: string
          refresh_token: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          created_at?: string
          expiry?: string
          refresh_token?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          agendamento_id: string | null
          created_at: string
          external_id: string
          id: string
          provider: string
          raw: Json | null
          status: string
        }
        Insert: {
          agendamento_id?: string | null
          created_at?: string
          external_id: string
          id?: string
          provider: string
          raw?: Json | null
          status: string
        }
        Update: {
          agendamento_id?: string | null
          created_at?: string
          external_id?: string
          id?: string
          provider?: string
          raw?: Json | null
          status?: string
        }
        Relationships: []
      }
      plan_payment_events: {
        Row: {
          created_at: string
          event_type: string
          external_id: string
          id: string
          provider: string
          raw: Json | null
          status: string
          subscription_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          external_id: string
          id?: string
          provider?: string
          raw?: Json | null
          status: string
          subscription_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          external_id?: string
          id?: string
          provider?: string
          raw?: Json | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_payment_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "tenant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarded: boolean
          phone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          onboarded?: boolean
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarded?: boolean
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional_servicos: {
        Row: {
          profissional_id: string
          servico_id: string
          tenant_id: string
        }
        Insert: {
          profissional_id: string
          servico_id: string
          tenant_id: string
        }
        Update: {
          profissional_id?: string
          servico_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissional_servicos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_servicos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_servicos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profissional_unidades: {
        Row: {
          profissional_id: string
          tenant_id: string
          unidade_id: string
        }
        Insert: {
          profissional_id: string
          tenant_id: string
          unidade_id: string
        }
        Update: {
          profissional_id?: string
          tenant_id?: string
          unidade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profissional_unidades_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_unidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profissional_unidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json
          severity: string
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          severity?: string
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          cor: string
          created_at: string
          descricao: string | null
          duracao_min: number
          id: string
          nome: string
          preco: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          duracao_min?: number
          id?: string
          nome: string
          preco?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cor?: string
          created_at?: string
          descricao?: string | null
          duracao_min?: number
          id?: string
          nome?: string
          preco?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_plan_history: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_plan: string
          new_status: string
          previous_plan: string | null
          previous_status: string | null
          reason: string | null
          tenant_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_plan: string
          new_status: string
          previous_plan?: string | null
          previous_status?: string | null
          reason?: string | null
          tenant_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_plan?: string
          new_status?: string
          previous_plan?: string | null
          previous_status?: string | null
          reason?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      tenant_subscriptions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          current_period_end: string | null
          id: string
          idempotency_key: string | null
          mode: string
          mp_payer_email: string | null
          mp_preapproval_id: string | null
          mp_preference_id: string | null
          plan: string
          provider: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          id?: string
          idempotency_key?: string | null
          mode: string
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          mp_preference_id?: string | null
          plan: string
          provider?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          id?: string
          idempotency_key?: string | null
          mode?: string
          mp_payer_email?: string | null
          mp_preapproval_id?: string | null
          mp_preference_id?: string | null
          plan?: string
          provider?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          address: string | null
          business_type: Database["public"]["Enums"]["business_type"]
          city: string | null
          cnpj: string | null
          created_at: string
          id: string
          instagram: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          plan: string
          plan_status: string
          professionals_count: string | null
          slug: string
          state: string | null
          trial_start_date: string
          updated_at: string
          whatsapp: string | null
          whatsapp_settings: Json
          working_days: string[] | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          plan?: string
          plan_status?: string
          professionals_count?: string | null
          slug: string
          state?: string | null
          trial_start_date?: string
          updated_at?: string
          whatsapp?: string | null
          whatsapp_settings?: Json
          working_days?: string[] | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          business_type?: Database["public"]["Enums"]["business_type"]
          city?: string | null
          cnpj?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          plan?: string
          plan_status?: string
          professionals_count?: string | null
          slug?: string
          state?: string | null
          trial_start_date?: string
          updated_at?: string
          whatsapp?: string | null
          whatsapp_settings?: Json
          working_days?: string[] | null
          working_hours?: string | null
        }
        Relationships: []
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          created_at: string
          id: string
          ip_address: string | null
          privacy_version: string
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          privacy_version: string
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          privacy_version?: string
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      unidades: {
        Row: {
          ativo: boolean
          created_at: string
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage: { Args: { _tenant_id: string }; Returns: boolean }
      complete_onboarding: {
        Args: {
          _business_type: Database["public"]["Enums"]["business_type"]
          _name: string
          _phone: string
          _slug: string
        }
        Returns: string
      }
      current_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean }
      update_tenant_slug: { Args: { _new_slug: string }; Returns: string }
    }
    Enums: {
      agendamento_status:
        | "pendente"
        | "confirmado"
        | "concluido"
        | "cancelado"
        | "faltou"
      app_role: "super_admin" | "owner" | "manager" | "professional" | "client"
      business_type:
        | "lash_designer"
        | "nail_designer"
        | "manicure"
        | "sobrancelhas"
        | "estetica"
        | "salao_beleza"
        | "studio_beleza"
        | "cabeleireiro"
        | "outro"
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
    Enums: {
      agendamento_status: [
        "pendente",
        "confirmado",
        "concluido",
        "cancelado",
        "faltou",
      ],
      app_role: ["super_admin", "owner", "manager", "professional", "client"],
      business_type: [
        "lash_designer",
        "nail_designer",
        "manicure",
        "sobrancelhas",
        "estetica",
        "salao_beleza",
        "studio_beleza",
        "cabeleireiro",
        "outro",
      ],
    },
  },
} as const
