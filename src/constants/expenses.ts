export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'insurance',
  'telecom',
  'medical',
  'subscription',
  'supplement',
  'beauty',
  'clothing',
  'other',
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '飲食',
  transport: '交通',
  entertainment: '娛樂',
  insurance: '保險',
  telecom: '電信',
  medical: '醫療',
  subscription: '訂閱服務',
  supplement: '保健食品',
  beauty: '美妝用品',
  clothing: '治裝',
  other: '其他',
}

export const EXPENSE_CATEGORY_EMOJIS: Record<ExpenseCategory, string> = {
  food: '🍜',
  transport: '🚌',
  entertainment: '🎮',
  insurance: '🛡️',
  telecom: '📱',
  medical: '🏥',
  subscription: '📺',
  supplement: '💊',
  beauty: '💄',
  clothing: '👕',
  other: '✨',
}
