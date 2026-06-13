/** 回傳 YYYY-MM 格式的月份字串（資料庫 month 欄位格式） */
export function getCurrentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** 回傳該月份的起始日與下月起始日（半開區間，供日期範圍查詢） */
export function getMonthRange(month: string) {
  const [year, monthNum] = month.split('-').map(Number)
  const start = `${month}-01`
  const end =
    monthNum === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNum + 1).padStart(2, '0')}-01`
  return { start, end }
}
