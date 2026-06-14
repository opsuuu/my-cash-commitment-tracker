import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { addMonths } from '@/lib/date'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type Commitment = Tables<'commitments'>
export type CommitmentSchedule = Tables<'commitment_schedules'>

const commitmentsKey = ['commitments'] as const
const statsKey = ['commitment-stats'] as const
const schedulesKey = (commitmentId: string) => ['commitment-schedules', commitmentId] as const

/** 結算/建立/取消後，預算池卡片與帳戶餘額都可能變動，需一併失效 */
function invalidateDownstream(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: commitmentsKey })
  void queryClient.invalidateQueries({ queryKey: statsKey })
  void queryClient.invalidateQueries({ queryKey: ['installment-progress'] })
  void queryClient.invalidateQueries({ queryKey: ['spending-stats'] })
}

/**
 * 取回所有承諾支出（依建立時間新到舊）。狀態/名稱篩選比照預算池頁的做法在
 * 元件端 client-side 處理（資料量小、避免每次按鍵都打 query）。
 */
export function useCommitments() {
  return useQuery({
    queryKey: commitmentsKey,
    queryFn: async (): Promise<Commitment[]> => {
      const { data, error } = await supabase
        .from('commitments')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export interface CommitmentStats {
  pendingTotal: number
  pendingCount: number
}

/**
 * 總承諾金額（available_cash 的扣項，保守原則取全額）：
 * Σ one_time pending + Σ 所有 pending schedules
 */
export function useCommitmentStats() {
  return useQuery({
    queryKey: statsKey,
    queryFn: async (): Promise<CommitmentStats> => {
      const [oneTimeRes, schedulesRes] = await Promise.all([
        supabase
          .from('commitments')
          .select('amount')
          .eq('type', 'one_time')
          .eq('status', 'pending'),
        supabase.from('commitment_schedules').select('amount').eq('status', 'pending'),
      ])
      if (oneTimeRes.error) throw oneTimeRes.error
      if (schedulesRes.error) throw schedulesRes.error

      const oneTime = oneTimeRes.data.reduce((sum, r) => sum + r.amount, 0)
      const scheduled = schedulesRes.data.reduce((sum, r) => sum + r.amount, 0)
      return {
        pendingTotal: oneTime + scheduled,
        pendingCount: oneTimeRes.data.length + schedulesRes.data.length,
      }
    },
  })
}

export interface InstallmentProgress {
  total: number
  charged: number
  pending: number
}

/**
 * 一次取回所有分期的期程進度（避免每張分期卡片各打一輪查詢）。
 * 回傳以 commitment_id 為 key 的 { total, charged, pending }。
 */
export function useInstallmentProgress() {
  return useQuery({
    queryKey: ['installment-progress'],
    queryFn: async (): Promise<Record<string, InstallmentProgress>> => {
      const { data, error } = await supabase
        .from('commitment_schedules')
        .select('commitment_id, status')
      if (error) throw error

      const map: Record<string, InstallmentProgress> = {}
      for (const row of data) {
        const entry = (map[row.commitment_id] ??= { total: 0, charged: 0, pending: 0 })
        entry.total += 1
        if (row.status === 'charged') entry.charged += 1
        else if (row.status === 'pending') entry.pending += 1
      }
      return map
    },
  })
}

/** 某筆分期承諾的所有期程（依 due_date 由早到晚） */
export function useCommitmentSchedules(commitmentId: string | null) {
  return useQuery({
    queryKey: commitmentId ? schedulesKey(commitmentId) : ['commitment-schedules', null],
    enabled: !!commitmentId,
    queryFn: async (): Promise<CommitmentSchedule[]> => {
      const { data, error } = await supabase
        .from('commitment_schedules')
        .select('*')
        .eq('commitment_id', commitmentId!)
        .order('due_date', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

export function useCreateCommitment() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<'commitments'>, 'user_id'>) => {
      if (!user) throw new Error('尚未登入')

      const { data: commitment, error } = await supabase
        .from('commitments')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error

      // 分期：逐月產生 N 筆 schedules（due_date 預設各月 1 號）。
      // 若這步失敗不做補償刪除——直接拋錯讓使用者重建（非金流，FK 補償不可靠）。
      if (
        commitment.type === 'installment' &&
        commitment.start_month &&
        commitment.installment_count &&
        commitment.installment_amount
      ) {
        const schedules: TablesInsert<'commitment_schedules'>[] = Array.from(
          { length: commitment.installment_count },
          (_, i) => ({
            commitment_id: commitment.id,
            due_date: `${addMonths(commitment.start_month!, i)}-01`,
            amount: commitment.installment_amount!,
          })
        )
        const { error: scheduleError } = await supabase
          .from('commitment_schedules')
          .insert(schedules)
        if (scheduleError) throw scheduleError
      }

      return commitment
    },
    onSuccess: () => invalidateDownstream(queryClient),
  })
}

export function useUpdateCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: TablesUpdate<'commitments'> & { id: string }) => {
      const { data, error } = await supabase
        .from('commitments')
        .update(input)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateDownstream(queryClient),
  })
}

export interface SettleCommitmentInput {
  commitmentId: string
  accountId: string
  actualAmount: number
  chargeDate: string
  /** 有值代表結算分期某一期；null/undefined 代表結算一次性承諾 */
  scheduleId?: string | null
  note?: string | null
}

/**
 * 標記已扣款（結算）。一次性與分期每期共用同一個 RPC（settle_commitment），
 * 原子完成「建 expense → 扣帳戶餘額 → 更新狀態」。scheduleId 決定走哪條路徑。
 */
export function useSettleCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      commitmentId,
      accountId,
      actualAmount,
      chargeDate,
      scheduleId,
      note,
    }: SettleCommitmentInput) => {
      const { data, error } = await supabase.rpc('settle_commitment', {
        p_commitment_id: commitmentId,
        p_account_id: accountId,
        p_actual_amount: actualAmount,
        p_charge_date: chargeDate,
        p_schedule_id: scheduleId ?? undefined,
        p_note: note ?? undefined,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, vars) => {
      invalidateDownstream(queryClient)
      void queryClient.invalidateQueries({ queryKey: schedulesKey(vars.commitmentId) })
      void queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export interface CancelCommitmentInput {
  id: string
  type: string
}

/**
 * 取消承諾。one_time → status=cancelled；installment → commitment cancelled
 * 並把所有 pending schedules 一併 cancelled（無金流，前端循序處理即可）。
 */
export function useCancelCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, type }: CancelCommitmentInput) => {
      if (type === 'installment') {
        const { error: scheduleError } = await supabase
          .from('commitment_schedules')
          .update({ status: 'cancelled' })
          .eq('commitment_id', id)
          .eq('status', 'pending')
        if (scheduleError) throw scheduleError
      }
      const { error } = await supabase
        .from('commitments')
        .update({ status: 'cancelled' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      invalidateDownstream(queryClient)
      void queryClient.invalidateQueries({ queryKey: schedulesKey(vars.id) })
    },
  })
}
