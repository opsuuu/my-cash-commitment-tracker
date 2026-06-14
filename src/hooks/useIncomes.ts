import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getMonthRange } from '@/lib/date'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type Income = Tables<'incomes'>

/**
 * Ledger Model 下收入皆為單表操作（不需餘額 RPC）；帳戶餘額由 account_balances
 * view 從 incomes 推導，故增刪改後一併失效 ['accounts'] 讓餘額重算。
 */
function invalidateIncome(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['incomes'] })
  void queryClient.invalidateQueries({ queryKey: ['income-stats'] })
  void queryClient.invalidateQueries({ queryKey: ['accounts'] })
}

/** 某月份的收入（date 由新到舊） */
export function useIncomes(month: string) {
  return useQuery({
    queryKey: ['incomes', month],
    queryFn: async (): Promise<Income[]> => {
      const { start, end } = getMonthRange(month)
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .gte('date', start)
        .lt('date', end)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export interface IncomeStats {
  total: number
  count: number
}

/** 月收入統計（供 hero 與未來 Dashboard 風險「近三月平均月收入」） */
export function useIncomeStats(month: string) {
  return useQuery({
    queryKey: ['income-stats', month],
    queryFn: async (): Promise<IncomeStats> => {
      const { start, end } = getMonthRange(month)
      const { data, error } = await supabase
        .from('incomes')
        .select('amount')
        .gte('date', start)
        .lt('date', end)
      if (error) throw error
      return { total: data.reduce((sum, r) => sum + r.amount, 0), count: data.length }
    },
  })
}

export function useCreateIncome() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'incomes'>, 'user_id'>) => {
      if (!user) throw new Error('尚未登入')
      const { data, error } = await supabase
        .from('incomes')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateIncome(queryClient),
  })
}

export function useUpdateIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'incomes'> & { id: string }) => {
      const { data, error } = await supabase
        .from('incomes')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateIncome(queryClient),
  })
}

export function useDeleteIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incomes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => invalidateIncome(queryClient),
  })
}
