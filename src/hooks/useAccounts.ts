import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Database, TablesInsert, TablesUpdate } from '@/types/database.types'

// 讀模型：account_balances view，current_balance 由交易即時推導（Ledger Model）。
// 寫入仍針對 accounts 表（initial_balance）；餘額變動靠新增交易，不直接改帳戶。
// 直接取 view 的 Row（繞過 Tables<> helper，其 intersection 對 view-only key 會退化成 never）。
export type Account = Database['public']['Views']['account_balances']['Row']

const accountsKey = ['accounts'] as const

export function useAccounts() {
  return useQuery({
    queryKey: accountsKey,
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from('account_balances')
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
      // Ledger Model：調整餘額 = 新增一筆 adjustment 交易（delta = new − previous），
      // 不直接改帳戶；current_balance 由 account_balances view 重新推導。
      const { error } = await supabase.from('balance_adjustments').insert({
        user_id: user.id,
        account_id: account.id,
        previous_balance: account.current_balance,
        new_balance: newBalance,
        reason,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountsKey }),
  })
}
