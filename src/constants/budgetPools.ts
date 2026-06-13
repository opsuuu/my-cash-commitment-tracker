export const POOL_TYPES = ['spending', 'saving'] as const

export type PoolType = (typeof POOL_TYPES)[number]

export const POOL_TYPE_LABELS: Record<PoolType, string> = {
  spending: '支出池',
  saving: '儲蓄池',
}

export const POOL_TYPE_EMOJIS: Record<PoolType, string> = {
  spending: '🛒',
  saving: '🌱',
}

export const ROLLOVER_MODES = ['reset', 'rollover', 'auto_sweep'] as const

export type RolloverMode = (typeof ROLLOVER_MODES)[number]

export const ROLLOVER_MODE_LABELS: Record<RolloverMode, string> = {
  reset: '月底歸零',
  rollover: '滾入下月',
  auto_sweep: '轉入儲蓄池',
}

export const ROLLOVER_MODE_HINTS: Record<RolloverMode, string> = {
  reset: '月底沒用完的額度直接歸零，下個月從月預算上限重新開始。',
  rollover:
    '月底沒用完的額度會累加到「這個支出池」下個月的可用額度。例如上限 6,000、只用了 5,000，剩下的 1,000 會讓下個月變成 7,000。',
  auto_sweep: '月底沒用完的額度自動轉入你指定的儲蓄池，幫你把剩下的錢存起來。',
}

export const POOL_MODES = ['virtual', 'account-backed'] as const

export type PoolMode = (typeof POOL_MODES)[number]

export const POOL_MODE_LABELS: Record<PoolMode, string> = {
  virtual: '虛擬記錄',
  'account-backed': '綁定帳戶',
}
