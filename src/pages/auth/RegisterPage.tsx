import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useGoogleLogin } from '@/hooks/useGoogleLogin'
import { AuthLayout, AuthCard, FormField, GoogleAuthButton } from '@/components/auth'
import { TextDivider } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const registerSchema = z
  .object({
    email: z.email('請輸入有效的電子郵件'),
    password: z.string().min(8, '密碼至少 8 個字元'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '兩次密碼不一致',
    path: ['confirmPassword'],
  })

interface RegisterFormValues {
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { login: googleLogin, loading: googleLoading } = useGoogleLogin(setAuthError)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setAuthError(null)
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setAuthError(error.message)
    } else if (signUpData.user?.identities?.length === 0) {
      // Supabase 對已存在的 email 會回假成功（identities 為空）以防 email 列舉攻擊
      setAuthError('此電子郵件已經註冊過，請直接登入或使用 Google 登入')
    } else {
      setSuccess(true)
    }
  }

  const handleGoogleLogin = () => {
    setAuthError(null)
    // void = 明確標記不等待此 Promise（fire-and-forget）：
    // 錯誤已由 hook 內的 onError 處理，成功則整頁跳轉，呼叫端無後續
    void googleLogin()
  }

  return (
    <AuthLayout subtitle="掌握每一筆已承諾的支出">
      <AuthCard title="建立帳號">
        {success ? (
          <Alert className="rounded-xl border-transparent bg-pearl-aqua/10 px-4 py-4 text-center">
            <span className="mb-1 text-4xl" aria-hidden="true">
              💌
            </span>
            <AlertTitle className="text-pearl-aqua">驗證信已寄出！</AlertTitle>
            <AlertDescription className="mt-1 block">請查看你的信箱並點擊驗證連結</AlertDescription>
            <Button asChild size="lg" className="mt-4 justify-self-center rounded-xl px-6">
              <Link to="/login">返回登入</Link>
            </Button>
          </Alert>
        ) : (
          <>
            {authError && (
              <Alert variant="destructive" className="mb-4 rounded-xl bg-danger/10 px-4 py-3">
                <AlertDescription>{authError}</AlertDescription>
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
                placeholder="至少 8 個字元"
                error={errors.password?.message}
                {...register('password')}
              />
              <FormField
                label="確認密碼"
                type="password"
                placeholder="再次輸入密碼"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl text-base"
              >
                {isSubmitting ? '建立中...' : '建立帳號'}
              </Button>
            </form>

            <TextDivider />

            <GoogleAuthButton
              onClick={handleGoogleLogin}
              loading={googleLoading}
              label="使用 Google 註冊"
            />

            <p className="mt-6 text-center text-sm text-text-secondary">
              已有帳號？{' '}
              <Link to="/login" className="text-primary hover:underline">
                立即登入
              </Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
