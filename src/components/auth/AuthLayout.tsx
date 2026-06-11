interface AuthLayoutProps {
  children: React.ReactNode
  subtitle?: string
}

export default function AuthLayout({ children, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-app-bg p-4">
      <div className="pointer-events-none fixed inset-0 bg-linear-to-br from-[#A9F1DF]/10 via-transparent to-[#FFBBBB]/20" />

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-3xl font-bold">
            <span className="bg-[linear-gradient(135deg,#A9F1DF,var(--color-periwinkle))] bg-clip-text text-transparent">
              Cash Commitment Tracker
            </span>
          </h1>
          {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  )
}
