import { useMemo, useState } from 'react'
import { HelpCircleIcon } from 'lucide-react'
import { useExpenses, useExpenseStats } from '@/hooks/useExpenses'
import { useBudgetPools } from '@/hooks/useBudgetPools'
import { useDismissible } from '@/hooks/useDismissible'
import { getCurrentMonth } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/constants/expenses'
import ExpenseCard from '@/components/expenses/ExpenseCard'
import ExpenseFormDialog from '@/components/expenses/ExpenseFormDialog'
import ExpenseConceptCallout from '@/components/expenses/ExpenseConceptCallout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function ExpensesPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [formOpen, setFormOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all')
  const [poolFilter, setPoolFilter] = useState<string>('all')
  const intro = useDismissible('expenses-intro')

  const { data: expenses, isPending, isError } = useExpenses(month)
  const { data: stats } = useExpenseStats(month)
  const { data: pools } = useBudgetPools()

  const filtered = useMemo(
    () =>
      (expenses ?? []).filter(
        (e) =>
          (categoryFilter === 'all' || e.category === categoryFilter) &&
          (poolFilter === 'all' || e.budget_pool_id === poolFilter)
      ),
    [expenses, categoryFilter, poolFilter]
  )

  if (isError) {
    return (
      <Alert variant="destructive" className="rounded-xl bg-danger/10 px-4 py-3">
        <AlertDescription>支出資料載入失敗，請重新整理頁面</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-floral-white">實際支出</h1>
          <p className="mt-1 text-sm text-text-muted">已經發生、錢已離開帳戶的支出</p>
        </div>
        <div className="flex items-center gap-2">
          {intro.dismissed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={intro.reopen}
              aria-label="重看支出說明"
              className="size-9 rounded-full text-text-muted hover:text-floral-white"
            >
              <HelpCircleIcon className="size-5" />
            </Button>
          )}
          <Button onClick={() => setFormOpen(true)} className="rounded-xl">
            ＋ 新增支出
          </Button>
        </div>
      </div>

      {!intro.dismissed && <ExpenseConceptCallout onDismiss={intro.dismiss} />}

      <Card className="mb-6 rounded-3xl bg-[linear-gradient(160deg,rgba(255,140,140,0.08),rgba(241,234,185,0.05))] ring-1 ring-inset ring-[rgba(255,140,140,0.14)] backdrop-blur-md [--card-spacing:--spacing(5)]">
        <CardContent className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted">本月支出</p>
            <p className="mt-1 bg-[linear-gradient(135deg,#FF8C8C,#F1EAB9)] bg-clip-text text-3xl font-bold tabular-nums text-transparent">
              {formatCurrency(stats?.total ?? 0)}
            </p>
            <p className="mt-1 text-xs text-text-muted">共 {stats?.count ?? 0} 筆</p>
          </div>
          <Input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="h-10 w-40 rounded-xl bg-white/5 px-3"
          />
        </CardContent>
      </Card>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition',
              categoryFilter === 'all'
                ? 'bg-secondary text-periwinkle'
                : 'text-text-secondary hover:bg-muted hover:text-foreground'
            )}
          >
            全部
          </button>
          {EXPENSE_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm transition',
                categoryFilter === c
                  ? 'bg-secondary text-periwinkle'
                  : 'text-text-secondary hover:bg-muted hover:text-foreground'
              )}
            >
              {EXPENSE_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {(pools ?? []).length > 0 && (
          <Select value={poolFilter} onValueChange={setPoolFilter}>
            <SelectTrigger className="w-full rounded-xl bg-white/5 px-4 data-[size=default]:h-10 sm:max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部預算池</SelectItem>
              {(pools ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isPending ? (
        <div className="flex justify-center py-24">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
          <CardContent className="py-8 text-center">
            <p className="text-5xl sm:text-7xl" aria-hidden="true">
              🧾
            </p>
            <p className="mt-6 font-medium text-floral-white">
              {categoryFilter === 'all'
                ? '這個月還沒有支出紀錄'
                : `這個月還沒有${EXPENSE_CATEGORY_LABELS[categoryFilter]}支出紀錄`}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              記下每筆花費，帳戶餘額與預算池消耗都會自動更新
            </p>
            <Button onClick={() => setFormOpen(true)} size="lg" className="mt-6 rounded-xl px-6">
              新增支出
            </Button>
          </CardContent>
        </Card>
      )}

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={null}
        defaultCategory={categoryFilter === 'all' ? undefined : categoryFilter}
      />
    </div>
  )
}
