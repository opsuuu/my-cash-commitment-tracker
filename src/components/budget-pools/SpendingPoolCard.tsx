import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type BudgetPool, type SpendingPoolStats } from '@/hooks/useBudgetPools'
import { POOL_TYPE_EMOJIS, ROLLOVER_MODE_LABELS, type RolloverMode } from '@/constants/budgetPools'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SpendingPoolCardProps {
  pool: BudgetPool
  stats?: SpendingPoolStats
  onEdit: (pool: BudgetPool) => void
  onDelete: (pool: BudgetPool) => void
}

export default function SpendingPoolCard({ pool, stats, onEdit, onDelete }: SpendingPoolCardProps) {
  const budget = pool.monthly_budget ?? 0
  const spent = stats?.spent ?? 0
  const committed = stats?.committed ?? 0
  const remaining = budget - spent - committed
  const usage = budget > 0 ? (spent + committed) / budget : 0

  return (
    <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(5)]">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-floral-white">
              <span className="mr-1.5" aria-hidden="true">
                {POOL_TYPE_EMOJIS.spending}
              </span>
              {pool.name}
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {ROLLOVER_MODE_LABELS[pool.rollover_mode as RolloverMode]}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                'text-lg font-semibold',
                remaining < 0 ? 'text-risk-soft' : 'text-floral-white'
              )}
            >
              {formatCurrency(remaining)}
            </p>
            <p className="text-xs text-text-muted">剩餘可用</p>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs text-text-muted">
            <span>
              已支出 {formatCurrency(spent)}・承諾中 {formatCurrency(committed)}
            </span>
            <span>月預算 {formatCurrency(budget)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usage >= 0.8 ? 'bg-risk-soft' : usage >= 0.5 ? 'bg-warning' : 'bg-safe'
              )}
              style={{ width: `${Math.min(usage * 100, 100)}%` }}
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
