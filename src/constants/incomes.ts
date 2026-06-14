export const INCOME_CATEGORIES = [
  'salary',
  'bonus',
  'freelance',
  'dividend',
  'interest',
  'refund',
  'other',
] as const

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  salary: '薪資',
  bonus: '獎金',
  freelance: '接案',
  dividend: '股利',
  interest: '利息',
  refund: '退款',
  other: '其他',
}

export const INCOME_CATEGORY_EMOJIS: Record<IncomeCategory, string> = {
  salary: '💰',
  bonus: '🎁',
  freelance: '💼',
  dividend: '📈',
  interest: '🏦',
  refund: '↩️',
  other: '✨',
}
