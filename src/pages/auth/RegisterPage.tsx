import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setAuthError(null)
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setAuthError(error.message)
    } else {
      setSuccess(true)
    }
  }

  const handleGoogleLogin = async () => {
    setAuthError(null)
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) {
      setAuthError(`Google 登入失敗：${error.message}`)
      setGoogleLoading(false)
    }
  }

  return (
    <AuthLayout subtitle="掌握每一筆已承諾的支出">
      <AuthCard title="建立帳號">
        {success ? (
          <Alert className="rounded-xl border-transparent bg-pearl-aqua/10 px-4 py-4 text-center">
            <AlertTitle className="text-pearl-aqua">驗證信已寄出！</AlertTitle>
            <AlertDescription className="mt-1 block">請查看你的信箱並點擊驗證連結</AlertDescription>
            <Link to="/login" className="mt-4 text-sm text-primary hover:underline">
              返回登入
            </Link>
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
