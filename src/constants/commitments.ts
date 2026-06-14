export const COMMITMENT_TYPES = ['one_time', 'installment'] as const

export type CommitmentType = (typeof COMMITMENT_TYPES)[number]

export const COMMITMENT_TYPE_LABELS: Record<CommitmentType, string> = {
  one_time: '一次性',
  installment: '分期',
}

export const COMMITMENT_TYPE_EMOJIS: Record<CommitmentType, string> = {
  one_time: '🧾',
  installment: '🗓️',
}

// 兩種類型的狀態聯集；one_time 用 pending/charged/cancelled，installment 用
// pending/active/completed/cancelled
export const COMMITMENT_STATUSES = [
  'pending',
  'active',
  'charged',
  'completed',
  'cancelled',
] as const

export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number]

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  pending: '待扣款',
  active: '進行中',
  charged: '已扣款',
  completed: '已完成',
  cancelled: '已取消',
}

export const COMMITMENT_STATUS_BADGE: Record<CommitmentStatus, string> = {
  pending: 'bg-warning/15 text-warning',
  active: 'bg-periwinkle/20 text-periwinkle',
  charged: 'bg-safe/15 text-safe',
  completed: 'bg-pearl-aqua/15 text-pearl-aqua',
  cancelled: 'bg-white/10 text-text-muted',
}

export const COMMITMENT_PRIORITIES = ['high', 'medium', 'low'] as const

export type CommitmentPriority = (typeof COMMITMENT_PRIORITIES)[number]

export const COMMITMENT_PRIORITY_LABELS: Record<CommitmentPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export const COMMITMENT_PRIORITY_BADGE: Record<CommitmentPriority, string> = {
  high: 'bg-risk-soft/15 text-risk-soft',
  medium: 'bg-wisteria-blue/15 text-lavender',
  low: 'bg-white/10 text-text-muted',
}

// 結算承諾時建立的 Expense 類別（DB settle_commitment 函式寫死同一字串）；
// Phase 6 定義支出類別分類後再 revisit
export const COMMITMENT_EXPENSE_CATEGORY = '承諾扣款'
