import { useCallback, useState } from 'react'

const STORAGE_PREFIX = 'cct:dismissed:'

/**
 * localStorage 記錄的「看過/關閉過」flag，用於一次性提示（如首次進頁的教學）。
 * 個人 app 範疇 localStorage 已足夠；要跨裝置同步才需改存 Supabase profile。
 */
export function useDismissible(key: string) {
  const storageKey = STORAGE_PREFIX + key

  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(storageKey) === '1'
  })

  const dismiss = useCallback(() => {
    window.localStorage.setItem(storageKey, '1')
    setDismissed(true)
  }, [storageKey])

  // 讓使用者之後能重新開啟提示（例如點 header 的「?」）
  const reopen = useCallback(() => {
    window.localStorage.removeItem(storageKey)
    setDismissed(false)
  }, [storageKey])

  return { dismissed, dismiss, reopen }
}
