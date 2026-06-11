import { useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Google OAuth 登入。成功時整頁跳轉至 Google，不會 resolve；
 * 失敗時透過 onError 回報並重置 loading。
 */
export function useGoogleLogin(onError: (message: string) => void) {
  const [loading, setLoading] = useState(false)

  const login = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      onError(`Google 登入失敗：${error.message}`)
      setLoading(false)
    }
  }

  return { login, loading }
}
