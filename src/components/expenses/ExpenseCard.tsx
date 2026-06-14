import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Expense } from '@/hooks/useExpenses'
import { useAccounts } from '@/hooks/useAccounts'
import { useBudgetPools } from '@/hooks/useBudgetPools'
import { formatCurrency } from '@/lib/format'
import {
  EXPENSE_CATEGORY_EMOJIS,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/constants/expenses'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ExpenseFormDialog from './ExpenseFormDialog'
import ExpenseDeleteDialog from './ExpenseDeleteDialog'

interface ExpenseCardProps {
  expense: Expense
}

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { data: accounts } = useAccounts()
  const { data: pools } = useBudgetPools()

  const account = accounts?.find((a) => a.id === expense.account_id)
  const pool = pools?.find((p) => p.id === expense.budget_pool_id)
  const isCommitmentSourced = expense.source_type === 'commitment'

  const category = expense.category as ExpenseCategory
  // 承諾來源未重新歸類前 category 為「承諾扣款」佔位，不在正式清單，用 fallback 顯示
  const categoryLabel = EXPENSE_CATEGORY_LABELS[category] ?? expense.category
  const categoryEmoji = EXPENSE_CATEGORY_EMOJIS[category] ?? '🧾'

  return (
    <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(5)]">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-floral-white">
              <span aria-hidden="true">{categoryEmoji}</span>
              <span className="truncate">{categoryLabel}</span>
              {isCommitmentSourced && (
                <span className="shrink-0 rounded-full bg-periwinkle/15 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-periwinkle">
                  來自承諾
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {account?.name ?? '未知帳戶'} ・{pool?.name ?? '未知預算池'} ・{expense.date}
            </p>
          </div>
          <p className="shrink-0 text-lg font-semibold tabular-nums text-floral-white">
            −{formatCurrency(expense.amount)}
          </p>
        </div>

        {expense.note && <p className="text-xs text-text-secondary">{expense.note}</p>}

        <div className="mt-auto flex gap-1.5 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="rounded-lg"
          >
            <PencilIcon />
            {isCommitmentSourced ? '重新歸類' : '編輯'}
          </Button>
          {/* 承諾來源支出不可直接刪除，須從承諾端操作 */}
          {!isCommitmentSourced && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="ml-auto rounded-lg text-text-muted"
            >
              <Trash2Icon />
              刪除
            </Button>
          )}
        </div>
      </CardContent>

      <ExpenseFormDialog open={editOpen} onOpenChange={setEditOpen} expense={expense} />
      <ExpenseDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} expense={expense} />
    </Card>
  )
}
