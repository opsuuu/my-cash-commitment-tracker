import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useGoogleLogin } from '@/hooks/useGoogleLogin'
import { AuthLayout, AuthCard, FormField, GoogleAuthButton } from '@/components/auth'
import { TextDivider } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.email('請輸入有效的電子郵件'),
  password: z.string().min(6, '密碼至少 6 個字元'),
})

interface LoginFormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showCredentialHint, setShowCredentialHint] = useState(false)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const { login: googleLogin, loading: googleLoading } = useGoogleLogin(setAuthError)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null)
    setShowCredentialHint(false)
    setUnconfirmedEmail(null)
    setResendStatus('idle')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      if (error.code === 'email_not_confirmed') {
        setAuthError('此帳號尚未完成 Email 驗證，請先點擊驗證信中的連結再登入')
        setUnconfirmedEmail(data.email)
      } else {
        setAuthError('電子郵件或密碼錯誤')
        setShowCredentialHint(true)
      }
    } else {
      navigate('/')
    }
  }

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail) return
    setResendStatus('sending')
    const { error } = await supabase.auth.resend({ type: 'signup', email: unconfirmedEmail })
    if (error) {
      setAuthError(`驗證信重寄失敗：${error.message}`)
      setResendStatus('idle')
    } else {
      setResendStatus('sent')
    }
  }

  const handleGoogleLogin = () => {
    setAuthError(null)
    setShowCredentialHint(false)
    setUnconfirmedEmail(null)
    // void = 明確標記不等待此 Promise（fire-and-forget）：
    // 錯誤已由 hook 內的 onError 處理，成功則整頁跳轉，呼叫端無後續
    void googleLogin()
  }

  return (
    <AuthLayout subtitle="掌握每一筆已承諾的支出">
      <AuthCard title="登入">
        {authError && (
          <Alert variant="destructive" className="mb-4 rounded-xl bg-danger/10 px-4 py-3">
            <AlertDescription>
              {authError}
              {showCredentialHint && (
                <span className="mt-1.5 block text-xs text-text-muted">
                  若你先前是使用 Google 註冊，此帳號尚未設定密碼——請改用「使用 Google
                  登入」，或透過「忘記密碼？」設定一組密碼。
                </span>
              )}
              {unconfirmedEmail &&
                (resendStatus === 'sent' ? (
                  <span className="mt-1.5 block text-xs text-text-muted">
                    驗證信已重寄至 {unconfirmedEmail}，請查看信箱 💌
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendStatus === 'sending'}
                    className="mt-1.5 block text-xs text-primary underline underline-offset-2 disabled:opacity-50"
                  >
                    {resendStatus === 'sending' ? '重寄中...' : '沒收到驗證信？點此重寄'}
                  </button>
                ))}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="電子郵件"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <FormField
            label="密碼"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              忘記密碼？
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl text-base"
          >
            {isSubmitting ? '登入中...' : '登入'}
          </Button>
        </form>

        <TextDivider />

        <GoogleAuthButton
          onClick={handleGoogleLogin}
          loading={googleLoading}
          label="使用 Google 登入"
        />

        <p className="mt-6 text-center text-sm text-text-secondary">
          還沒有帳號？{' '}
          <Link to="/register" className="text-primary hover:underline">
            立即註冊
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  )
}
