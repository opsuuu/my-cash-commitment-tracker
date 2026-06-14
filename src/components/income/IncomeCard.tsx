import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { type Income } from '@/hooks/useIncomes'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/format'
import {
  INCOME_CATEGORY_EMOJIS,
  INCOME_CATEGORY_LABELS,
  type IncomeCategory,
} from '@/constants/incomes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import IncomeFormDialog from './IncomeFormDialog'
import IncomeDeleteDialog from './IncomeDeleteDialog'

interface IncomeCardProps {
  income: Income
}

export default function IncomeCard({ income }: IncomeCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { data: accounts } = useAccounts()

  const account = accounts?.find((a) => a.id === income.account_id)
  const category = income.category as IncomeCategory

  return (
    <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(5)]">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-floral-white">
              <span aria-hidden="true">{INCOME_CATEGORY_EMOJIS[category]}</span>
              <span className="truncate">
                {INCOME_CATEGORY_LABELS[category] ?? income.category}
              </span>
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {account?.name ?? '未知帳戶'} ・{income.date}
            </p>
          </div>
          <p className="shrink-0 text-lg font-semibold tabular-nums text-safe">
            +{formatCurrency(income.amount)}
          </p>
        </div>

        {income.note && <p className="text-xs text-text-secondary">{income.note}</p>}

        <div className="mt-auto flex gap-1.5 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="rounded-lg"
          >
            <PencilIcon />
            編輯
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="ml-auto rounded-lg text-text-muted"
          >
            <Trash2Icon />
            刪除
          </Button>
        </div>
      </CardContent>

      <IncomeFormDialog open={editOpen} onOpenChange={setEditOpen} income={income} />
      <IncomeDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} income={income} />
    </Card>
  )
}
