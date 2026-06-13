import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type BudgetPool } from '@/hooks/useBudgetPools'
import { type Account } from '@/hooks/useAccounts'
import { POOL_TYPE_EMOJIS, POOL_MODE_LABELS, type PoolMode } from '@/constants/budgetPools'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SavingPoolCardProps {
  pool: BudgetPool
  /** account-backed 模式時用來查綁定帳戶的餘額與名稱 */
  accounts: Account[]
  onEdit: (pool: BudgetPool) => void
  onDelete: (pool: BudgetPool) => void
}

export default function SavingPoolCard({ pool, accounts, onEdit, onDelete }: SavingPoolCardProps) {
  const linkedAccount = accounts.find((a) => a.id === pool.linked_account_id)
  const isAccountBacked = (pool.pool_mode as PoolMode) === 'account-backed'
  const current = isAccountBacked ? (linkedAccount?.balance ?? 0) : (pool.current_amount ?? 0)
  const target = pool.target_amount ?? 0
  const progress = target > 0 ? Math.max(current, 0) / target : 0

  return (
    <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(5)]">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-floral-white">
              <span className="mr-1.5" aria-hidden="true">
                {POOL_TYPE_EMOJIS.saving}
              </span>
              {pool.name}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {isAccountBacked && linkedAccount
                ? `綁定 ${linkedAccount.name}`
                : POOL_MODE_LABELS[pool.pool_mode as PoolMode]}
              {pool.target_date && `・目標 ${pool.target_date}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-pearl-aqua">{formatCurrency(current)}</p>
            <p className="text-xs text-text-muted">目前累積</p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-text-muted">
            <span>目標 {formatCurrency(target)}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#D8B5FF,#1EAE98)] transition-all"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-auto flex gap-1.5 pt-1">
          <Button variant="secondary" size="sm" onClick={() => onEdit(pool)} className="rounded-lg">
            <PencilIcon />
            編輯
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onDelete(pool)}
            className="ml-auto rounded-lg text-text-muted"
          >
            <Trash2Icon />
            刪除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
