import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { AuthLayout, AuthCard, FormField } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const forgotPasswordSchema = z.object({
  email: z.email('請輸入有效的電子郵件'),
})

interface ForgotPasswordFormValues {
  email: string
}

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setAuthError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setAuthError(error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <AuthLayout>
      <AuthCard title="重設密碼" description="輸入你的電子郵件，我們會寄送重設連結">
        {success ? (
          <Alert className="rounded-xl border-transparent bg-pearl-aqua/10 px-4 py-4 text-center">
            <span className="mb-1 text-4xl" aria-hidden="true">
              💌
            </span>
            <AlertTitle className="text-pearl-aqua">重設連結已寄出！</AlertTitle>
            <AlertDescription className="mt-1 block">請查看你的信箱</AlertDescription>
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-xl text-base"
              >
                {isSubmitting ? '寄送中...' : '寄送重設連結'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-text-secondary">
              <Link to="/login" className="text-primary hover:underline">
                返回登入
              </Link>
            </p>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  )
}
