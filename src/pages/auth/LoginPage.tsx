import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
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
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setAuthError('電子郵件或密碼錯誤')
    } else {
      navigate('/')
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
      <AuthCard title="登入">
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
