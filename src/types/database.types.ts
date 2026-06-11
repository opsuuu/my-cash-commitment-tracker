export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
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
      balance_adjustments: {
        Row: {
          account_id: string
          created_at: string | null
          id: string
          new_balance: number
          previous_balance: number
          reason: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string | null
          id?: string
          new_balance: number
          previous_balance: number
          reason: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string | null
          id?: string
          new_balance?: number
          previous_balance?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'balance_adjustments_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'balance_adjustments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      accounts: {
        Row: {
          balance: number
          created_at: string | null
          credit_limit: number | null
          currency: string
          id: string
          is_active: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          credit_limit?: number | null
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          type: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          credit_limit?: number | null
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'accounts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      budget_pools: {
        Row: {
          created_at: string | null
          current_amount: number | null
          id: string
          linked_account_id: string | null
          monthly_budget: number | null
          name: string
          pool_mode: string
          rollover_mode: string
          sweep_to_pool_id: string | null
          target_amount: number | null
          target_date: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          linked_account_id?: string | null
          monthly_budget?: number | null
          name: string
          pool_mode?: string
          rollover_mode?: string
          sweep_to_pool_id?: string | null
          target_amount?: number | null
          target_date?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_amount?: number | null
          id?: string
          linked_account_id?: string | null
          monthly_budget?: number | null
          name?: string
          pool_mode?: string
          rollover_mode?: string
          sweep_to_pool_id?: string | null
          target_amount?: number | null
          target_date?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'budget_pools_linked_account_id_fkey'
            columns: ['linked_account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'budget_pools_sweep_to_pool_id_fkey'
            columns: ['sweep_to_pool_id']
            isOneToOne: false
            referencedRelation: 'budget_pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'budget_pools_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      commitment_schedules: {
        Row: {
          amount: number
          commitment_id: string
          created_at: string | null
          due_date: string
          id: string
          linked_expense_id: string | null
          status: string
        }
        Insert: {
          amount: number
          commitment_id: string
          created_at?: string | null
          due_date: string
          id?: string
          linked_expense_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          commitment_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          linked_expense_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'commitment_schedules_commitment_id_fkey'
            columns: ['commitment_id']
            isOneToOne: false
            referencedRelation: 'commitments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'commitment_schedules_linked_expense_id_fkey'
            columns: ['linked_expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
        ]
      }
      commitments: {
        Row: {
          amount: number
          budget_pool_id: string
          created_at: string | null
          currency: string
          expected_charge_date: string | null
          fx_rate: number | null
          id: string
          installment_amount: number | null
          installment_count: number | null
          linked_expense_id: string | null
          note: string | null
          order_date: string
          original_amount: number | null
          original_currency: string | null
          priority: string
          start_month: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          budget_pool_id: string
          created_at?: string | null
          currency?: string
          expected_charge_date?: string | null
          fx_rate?: number | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          linked_expense_id?: string | null
          note?: string | null
          order_date: string
          original_amount?: number | null
          original_currency?: string | null
          priority?: string
          start_month?: string | null
          status?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          budget_pool_id?: string
          created_at?: string | null
          currency?: string
          expected_charge_date?: string | null
          fx_rate?: number | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          linked_expense_id?: string | null
          note?: string | null
          order_date?: string
          original_amount?: number | null
          original_currency?: string | null
          priority?: string
          start_month?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'commitments_budget_pool_id_fkey'
            columns: ['budget_pool_id']
            isOneToOne: false
            referencedRelation: 'budget_pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'commitments_linked_expense_id_fkey'
            columns: ['linked_expense_id']
            isOneToOne: false
            referencedRelation: 'expenses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'commitments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      expenses: {
        Row: {
          account_id: string
          amount: number
          budget_pool_id: string
          category: string
          created_at: string | null
          currency: string
          date: string
          fx_rate: number | null
          id: string
          note: string | null
          original_amount: number | null
          original_currency: string | null
          source_id: string | null
          source_type: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          budget_pool_id: string
          category: string
          created_at?: string | null
          currency?: string
          date: string
          fx_rate?: number | null
          id?: string
          note?: string | null
          original_amount?: number | null
          original_currency?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          budget_pool_id?: string
          category?: string
          created_at?: string | null
          currency?: string
          date?: string
          fx_rate?: number | null
          id?: string
          note?: string | null
          original_amount?: number | null
          original_currency?: string | null
          source_id?: string | null
          source_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_budget_pool_id_fkey'
            columns: ['budget_pool_id']
            isOneToOne: false
            referencedRelation: 'budget_pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      incomes: {
        Row: {
          account_id: string
          amount: number
          category: string
          created_at: string | null
          currency: string
          date: string
          id: string
          note: string | null
          related_commitment_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category: string
          created_at?: string | null
          currency?: string
          date: string
          id?: string
          note?: string | null
          related_commitment_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string
          created_at?: string | null
          currency?: string
          date?: string
          id?: string
          note?: string | null
          related_commitment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'incomes_account_id_fkey'
            columns: ['account_id']
            isOneToOne: false
            referencedRelation: 'accounts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'incomes_related_commitment_id_fkey'
            columns: ['related_commitment_id']
            isOneToOne: false
            referencedRelation: 'commitments'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'incomes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      monthly_allocations: {
        Row: {
          allocated_amount: number
          created_at: string | null
          id: string
          month: string
          pool_id: string
          user_id: string
        }
        Insert: {
          allocated_amount?: number
          created_at?: string | null
          id?: string
          month: string
          pool_id: string
          user_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string | null
          id?: string
          month?: string
          pool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'monthly_allocations_pool_id_fkey'
            columns: ['pool_id']
            isOneToOne: false
            referencedRelation: 'budget_pools'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'monthly_allocations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
