import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getMonthRange } from '@/lib/date'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type Expense = Tables<'expenses'>

/**
 * Ledger Model 下支出皆為單表操作（不需餘額 RPC）；帳戶餘額由 account_balances
 * view 從 expenses 推導。支出也計入預算池「已花費」（useSpendingMonthStats），
 * 故增刪改後一併失效帳戶與預算池統計。
 */
function invalidateExpense(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['expenses'] })
  void queryClient.invalidateQueries({ queryKey: ['expense-stats'] })
  void queryClient.invalidateQueries({ queryKey: ['accounts'] })
  void queryClient.invalidateQueries({ queryKey: ['spending-stats'] })
  void queryClient.invalidateQueries({ queryKey: ['budget-pools'] })
}

/** 某月份的支出（date 由新到舊） */
export function useExpenses(month: string) {
  return useQuery({
    queryKey: ['expenses', month],
    queryFn: async (): Promise<Expense[]> => {
      const { start, end } = getMonthRange(month)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', start)
        .lt('date', end)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export interface ExpenseStats {
  total: number
  count: number
}

/** 月支出統計 */
export function useExpenseStats(month: string) {
  return useQuery({
    queryKey: ['expense-stats', month],
    queryFn: async (): Promise<ExpenseStats> => {
      const { start, end } = getMonthRange(month)
      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', start)
        .lt('date', end)
      if (error) throw error
      return { total: data.reduce((sum, r) => sum + r.amount, 0), count: data.length }
    },
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'expenses'>, 'user_id'>) => {
      if (!user) throw new Error('尚未登入')
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateExpense(queryClient),
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'expenses'> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateExpense(queryClient),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateExpense(queryClient),
  })
}
