import { useState } from 'react'
import { useAccounts, type Account } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/format'
import AccountCard from '@/components/accounts/AccountCard'
import AccountFormDialog from '@/components/accounts/AccountFormDialog'
import AdjustBalanceDialog from '@/components/accounts/AdjustBalanceDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export default function AccountsPage() {
  const { data: accounts, isPending, isError } = useAccounts()
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null)

  const activeAccounts = accounts?.filter((a) => a.is_active) ?? []
  const inactiveAccounts = accounts?.filter((a) => !a.is_active) ?? []
  const totalBalance = activeAccounts.reduce((sum, a) => sum + a.current_balance, 0)

  const openCreate = () => {
    setEditingAccount(null)
    setFormOpen(true)
  }

  const openEdit = (account: Account) => {
    setEditingAccount(account)
    setFormOpen(true)
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="rounded-xl bg-danger/10 px-4 py-3">
        <AlertDescription>帳戶資料載入失敗，請重新整理頁面</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-floral-white">帳戶</h1>
        <Button onClick={openCreate} className="rounded-xl">
          ＋ 新增帳戶
        </Button>
      </div>

      {activeAccounts.length === 0 && inactiveAccounts.length === 0 ? (
        <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
          <CardContent className="py-8 text-center">
            <p className="text-5xl sm:text-7xl" aria-hidden="true">
              🏦
            </p>
            <p className="mt-6 mb-4 font-medium text-floral-white">還沒有任何帳戶</p>
            <p className="mt-1 text-sm text-text-muted">
              新增你的第一個帳戶，開始追蹤資金與承諾支出
            </p>
            <Button onClick={openCreate} size="lg" className="mt-6 rounded-xl px-6">
              新增帳戶
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* hero 卡片：1px 漸層邊框 + 實色底，與一般帳戶卡的玻璃擬態區隔（設計規範的「強調卡片 border 光暈」） */}
          <div
            className={cn(
              'rounded-3xl p-px',
              totalBalance < 0
                ? 'bg-[linear-gradient(135deg,#D74177,#FFE98A)]'
                : 'bg-[linear-gradient(135deg,#BFF098,#6FD6FF)]'
            )}
          >
            <Card className="rounded-[calc(var(--radius-3xl)-1px)] bg-app-bg-alt ring-0 [--card-spacing:--spacing(6)]">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-muted">
                    總餘額（{activeAccounts.length} 個帳戶）
                  </p>
                  {/* hero 數字一律漸層：正值用「安全」組合，負值用「高風險」組合 */}
                  <p
                    className={cn(
                      'mt-1 bg-clip-text text-3xl font-bold text-transparent',
                      totalBalance < 0
                        ? 'bg-[linear-gradient(90deg,#D74177,#FFE98A)]'
                        : 'bg-[linear-gradient(90deg,#BFF098,#6FD6FF)]'
                    )}
                  >
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {activeAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={openEdit}
                onAdjust={setAdjustingAccount}
              />
            ))}
          </div>

          {inactiveAccounts.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-medium text-text-muted">
                已停用（{inactiveAccounts.length}）
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {inactiveAccounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={openEdit}
                    onAdjust={setAdjustingAccount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AccountFormDialog open={formOpen} onOpenChange={setFormOpen} account={editingAccount} />
      <AdjustBalanceDialog
        open={!!adjustingAccount}
        onOpenChange={(open) => !open && setAdjustingAccount(null)}
        account={adjustingAccount}
      />
    </div>
  )
}
