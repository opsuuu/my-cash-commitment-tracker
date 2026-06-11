import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type Account = Tables<'accounts'>

const accountsKey = ['accounts'] as const

export function useAccounts() {
  return useQuery({
    queryKey: accountsKey,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'accounts'>, 'user_id'>) => {
      if (!user) throw new Error('尚未登入')
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'accounts'> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }),
  })
}

interface AdjustBalanceInput {
  account: Account
  newBalance: number
  reason: string
}

export function useAdjustBalance() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ account, newBalance, reason }: AdjustBalanceInput) => {
      if (!user) throw new Error('尚未登入')
      // 先寫入調整記錄再更新餘額；若餘額更新失敗，多一筆記錄但餘額未變，
      // 不會造成金額錯誤（反向順序失敗則會丟失調整原因）
      const { error: logError } = await supabase.from('balance_adjustments').insert({
        user_id: user.id,
        account_id: account.id,
        previous_balance: account.balance,
        new_balance: newBalance,
        reason,
      })
      if (logError) throw logError

      const { data, error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', account.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }),
  })
}
