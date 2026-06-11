import { toast } from 'sonner'
import { ArchiveIcon, ArchiveRestoreIcon, CoinsIcon, PencilIcon } from 'lucide-react'
import { useUpdateAccount, type Account } from '@/hooks/useAccounts'
import { ACCOUNT_TYPE_EMOJIS, ACCOUNT_TYPE_LABELS, type AccountType } from '@/constants/accounts'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AccountCardProps {
  account: Account
  onEdit: (account: Account) => void
  onAdjust: (account: Account) => void
}

export default function AccountCard({ account, onEdit, onAdjust }: AccountCardProps) {
  const updateAccount = useUpdateAccount()
  const type = account.type as AccountType

  // 信用卡使用率 = 未繳欠款 / 額度（balance 為負數代表欠款；溢繳時視為 0%）
  const creditUsage =
    type === 'credit_card' && account.credit_limit
      ? Math.max(-account.balance, 0) / account.credit_limit
      : null

  const handleToggleActive = async () => {
    try {
      await updateAccount.mutateAsync({ id: account.id, is_active: !account.is_active })
      toast.success(account.is_active ? '帳戶已停用' : '帳戶已啟用')
    } catch {
      toast.error('操作失敗，請稍後再試')
    }
  }

  return (
    <Card
      className={cn(
        'rounded-3xl backdrop-blur-md [--card-spacing:--spacing(5)]',
        !account.is_active && 'opacity-60'
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-floral-white">
              <span className="mr-1.5" aria-hidden="true">
                {ACCOUNT_TYPE_EMOJIS[type]}
              </span>
              {account.name}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">{ACCOUNT_TYPE_LABELS[type]}</p>
          </div>
          {type === 'credit_card' ? (
            <div className="text-right">
              {/* 未繳金額用 wisteria-blue 作為信用卡識別色；使用率 >= 80%（高風險）轉為 risk-soft 警示，與進度條門檻一致 */}
              <p
                className={cn(
                  'text-lg font-semibold',
                  creditUsage !== null && creditUsage >= 0.8
                    ? 'text-risk-soft'
                    : 'text-wisteria-blue'
                )}
              >
                {formatCurrency(Math.abs(account.balance))}
              </p>
              <p className="text-xs text-text-muted">{account.balance > 0 ? '溢繳' : '未繳'}</p>
            </div>
          ) : (
            <p className="text-lg font-semibold text-floral-white">
              {formatCurrency(account.balance)}
            </p>
          )}
        </div>

        {creditUsage !== null && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-text-muted">
              <span>額度使用率</span>
              <span>{Math.round(creditUsage * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  creditUsage >= 0.8
                    ? 'bg-risk-soft'
                    : creditUsage >= 0.5
                      ? 'bg-warning'
                      : 'bg-safe'
                )}
                style={{ width: `${Math.min(creditUsage * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex gap-1.5 pt-1">
          {account.is_active ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(account)}
                className="rounded-lg"
              >
                <PencilIcon />
                編輯
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAdjust(account)}
                className="rounded-lg"
              >
                <CoinsIcon />
                調整餘額
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleActive}
                disabled={updateAccount.isPending}
                className="ml-auto rounded-lg text-text-muted"
              >
                <ArchiveIcon />
                停用
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleToggleActive}
              disabled={updateAccount.isPending}
              className="rounded-lg"
            >
              <ArchiveRestoreIcon />
              重新啟用
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
