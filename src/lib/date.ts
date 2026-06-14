/** 回傳 YYYY-MM 格式的月份字串（資料庫 month 欄位格式） */
export function getCurrentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 回傳本地時區的今天 YYYY-MM-DD。不可用 toISOString().slice(0,10)——那是 UTC，
 * 在 UTC+8 的深夜/月初會把日期挪到前一天/上個月，導致剛建立的資料落在別的月份看不到。
 */
export function getToday(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 在 YYYY-MM 上加 n 個月，回傳 YYYY-MM（供分期承諾逐月產生期程） */
export function addMonths(month: string, n: number) {
  const [year, m] = month.split('-').map(Number)
  const total = year * 12 + (m - 1) + n
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

/** 回傳該月份的起始日與下月起始日（半開區間，供日期範圍查詢） */
export function getMonthRange(month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  const start = `${month}-01`
  const end =
    monthNum === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNum + 1).padStart(2, '0')}-01`
  return { start, end }
}
