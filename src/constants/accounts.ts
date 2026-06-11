export const ACCOUNT_TYPES = ['cash', 'bank', 'credit_card', 'investment'] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: '現金',
  bank: '銀行',
  credit_card: '信用卡',
  investment: '投資',
}

export const ACCOUNT_TYPE_EMOJIS: Record<AccountType, string> = {
  cash: '💵',
  bank: '🏦',
  credit_card: '💳',
  investment: '📈',
}
