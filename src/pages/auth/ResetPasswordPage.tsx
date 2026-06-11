import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AuthLayout, AuthCard, FormField } from '@/components/auth'
import { FullPageLoader } from '@/components/common'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, '密碼至少 8 個字元'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '兩次密碼不一致',
    path: ['confirmPassword'],
  })

interface ResetPasswordFormValues {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const { session, loading } = useAuth()
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  if (loading) return <FullPageLoader />

  // 重設連結會帶著 recovery session 進來；沒有 session 代表連結無效或已過期
  if (!session) {
    return (
      <AuthLayout>
        <AuthCard title="重設密碼">
          <Alert variant="destructive" className="rounded-xl bg-danger/10 px-4 py-4 text-center">
            <span className="mb-1 text-4xl" aria-hidden="true">
              🥺
            </span>
            <AlertTitle>連結無效或已過期</AlertTitle>
            <AlertDescription className="mt-1 block">請重新申請密碼重設信</AlertDescription>
            <Button asChild size="lg" className="mt-4 justify-self-center rounded-xl px-6">
              <Link to="/forgot-password">重新申請</Link>
            </Button>
          </Alert>
        </AuthCard>
      </AuthLayout>
    )
  }

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setAuthError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      setAuthError(error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <AuthLayout>
      <AuthCard title="重設密碼" description="為你的帳號設定新密碼">
        {success ? (
          <Alert className="rounded-xl border-transparent bg-pearl-aqua/10 px-4 py-4 text-center">
            <span className="mb-1 text-4xl" aria-hidden="true">
              🎉
            </span>
            <AlertTitle className="text-pearl-aqua">密碼已更新！</AlertTitle>
            <AlertDescription className="mt-1 block">下次請使用新密碼登入</AlertDescription>
            <Button asChild size="lg" className="mt-4 justify-self-center rounded-xl px-6">
              <Link to="/">前往 Dashboard</Link>
            </Button>
          </Alert>
        ) : (
          <>
            {authError && (
              <Alert variant="destructive" className="mb-4 rounded-xl bg-danger/10 px-4 py-3">
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                label="新密碼"
                type="password"
                placeholder="至少 8 個字元"
                error={errors.password?.message}
                {...register('password')}
              />
              <FormField
                label="確認新密碼"
                type="password"
                placeholder="再次輸入新密碼"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl text-base"
              >
                {isSubmitting ? '更新中...' : '更新密碼'}
              </Button>
            </form>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
