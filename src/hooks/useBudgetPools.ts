import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { getMonthRange } from '@/lib/date'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type BudgetPool = Tables<'budget_pools'>

const poolsKey = ['budget-pools'] as const

export function useBudgetPools() {
  return useQuery({
    queryKey: poolsKey,
    queryFn: async (): Promise<BudgetPool[]> => {
      const { data, error } = await supabase
        .from('budget_pools')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export interface SpendingPoolStats {
  spent: number
  committed: number
}

/**
 * 一次取回指定月份所有 spending pool 的統計（避免每張卡片各打一輪查詢）。
 * 公式依 DESIGN.md：
 * 剩餘 = monthly_budget - 當月已支出 - 該池全部 pending 一次性承諾 - 該池當月 pending 分期
 */
export function useSpendingMonthStats(month: string) {
  return useQuery({
    queryKey: ['spending-stats', month],
    queryFn: async (): Promise<Record<string, SpendingPoolStats>> => {
      const { start, end } = getMonthRange(month)

      const [expensesRes, commitmentsRes, schedulesRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('budget_pool_id, amount')
          .gte('date', start)
          .lt('date', end),
        supabase
          .from('commitments')
          .select('budget_pool_id, amount')
          .eq('status', 'pending')
          .eq('type', 'one_time'),
        supabase
          .from('commitment_schedules')
          .select('amount, commitments!inner(budget_pool_id)')
          .eq('status', 'pending')
          .gte('due_date', start)
          .lt('due_date', end),
      ])
      if (expensesRes.error) throw expensesRes.error
      if (commitmentsRes.error) throw commitmentsRes.error
      if (schedulesRes.error) throw schedulesRes.error

      const stats: Record<string, SpendingPoolStats> = {}
      const ensure = (poolId: string) => (stats[poolId] ??= { spent: 0, committed: 0 })

      for (const row of expensesRes.data) {
        ensure(row.budget_pool_id).spent += row.amount
      }
      for (const row of commitmentsRes.data) {
        ensure(row.budget_pool_id).committed += row.amount
      }
      for (const row of schedulesRes.data) {
        ensure(row.commitments.budget_pool_id).committed += row.amount
      }
      return stats
    },
  })
}

export function useCreateBudgetPool() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'budget_pools'>, 'user_id'>) => {
      if (!user) throw new Error('尚未登入')
      const { data, error } = await supabase
        .from('budget_pools')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: poolsKey })
      // sweep 關聯可能改變，刪除前檢查的快取一併失效
      void queryClient.invalidateQueries({ queryKey: ['pool-references'] })
    },
  })
}

export function useUpdateBudgetPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'budget_pools'> & { id: string }) => {
      const { data, error } = await supabase
        .from('budget_pools')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: poolsKey })
      void queryClient.invalidateQueries({ queryKey: ['pool-references'] })
    },
  })
}

export function useDeleteBudgetPool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_pools').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: poolsKey }),
  })
}

export interface PoolReferences {
  expenseCount: number
  commitmentCount: number
  sweepSourceNames: string[]
}

/** 刪除前檢查：此池是否被交易記錄或其他池的 auto_sweep 引用 */
export function usePoolReferences(poolId: string | null) {
  return useQuery({
    queryKey: ['pool-references', poolId],
    enabled: !!poolId,
    // 安全檢查必須即時，不能吃全域 5 分鐘快取（sweep 關聯可能剛剛才建立）
    staleTime: 0,
    queryFn: async (): Promise<PoolReferences> => {
      if (!poolId) throw new Error('no pool')
      const [expensesRes, commitmentsRes, sweepRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('id', { count: 'exact', head: true })
          .eq('budget_pool_id', poolId),
        supabase
          .from('commitments')
          .select('id', { count: 'exact', head: true })
          .eq('budget_pool_id', poolId),
        supabase.from('budget_pools').select('name').eq('sweep_to_pool_id', poolId),
      ])
      if (expensesRes.error) throw expensesRes.error
      if (commitmentsRes.error) throw commitmentsRes.error
      if (sweepRes.error) throw sweepRes.error

      return {
        expenseCount: expensesRes.count ?? 0,
        commitmentCount: commitmentsRes.count ?? 0,
        sweepSourceNames: sweepRes.data.map((p) => p.name),
      }
    },
  })
}
