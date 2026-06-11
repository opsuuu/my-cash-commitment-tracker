import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/accounts', label: '帳戶' },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-svh bg-app-bg">
      <header className="border-b border-border bg-app-bg-alt/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold whitespace-nowrap">
              <span className="bg-[linear-gradient(135deg,#A9F1DF,var(--color-periwinkle))] bg-clip-text text-transparent">
                CCT
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-1.5 text-sm transition',
                      isActive
                        ? 'bg-secondary text-secondary-foreground'
                        : 'text-text-secondary hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-text-muted sm:inline">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="rounded-lg bg-transparent text-lavender hover:text-lavender"
            >
              登出
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <Toaster position="top-center" />
    </div>
  )
}
