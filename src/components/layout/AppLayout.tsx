import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboardIcon,
  WalletIcon,
  PiggyBankIcon,
  ReceiptIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/accounts', label: '帳戶', icon: WalletIcon },
  { to: '/income', label: '收入', icon: TrendingUpIcon },
  { to: '/budget-pools', label: '預算池', icon: PiggyBankIcon },
  { to: '/commitments', label: '承諾支出', icon: ReceiptIcon },
  { to: '/expenses', label: '實際支出', icon: TrendingDownIcon },
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
            {/* 桌機才把導覽放在 header；手機改用底部固定列 */}
            <nav className="hidden items-center gap-1 sm:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition',
                      isActive
                        ? 'bg-secondary font-medium text-periwinkle'
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
            <span className="hidden max-w-40 truncate text-sm text-text-muted lg:inline-block">
              {user?.email}
            </span>
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

      {/* 手機底部留白避免內容被固定導覽列遮住 */}
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28 sm:px-6 sm:pb-8">
        <Outlet />
      </main>

      {/* 手機底部固定導覽列 */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-app-bg-alt/80 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="flex items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition',
                    isActive
                      ? 'font-medium text-periwinkle'
                      : 'text-text-muted hover:text-foreground'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('size-5', isActive && 'text-periwinkle')} />
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      <Toaster position="top-center" />
    </div>
  )
}
