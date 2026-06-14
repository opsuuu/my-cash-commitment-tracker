import { useMemo, useState } from 'react'
import { useIncomes, useIncomeStats } from '@/hooks/useIncomes'
import { getCurrentMonth } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { INCOME_CATEGORIES, INCOME_CATEGORY_LABELS, type IncomeCategory } from '@/constants/incomes'
import IncomeCard from '@/components/income/IncomeCard'
import IncomeFormDialog from '@/components/income/IncomeFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export default function IncomesPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [formOpen, setFormOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<'all' | IncomeCategory>('all')

  const { data: incomes, isPending, isError } = useIncomes(month)
  const { data: stats } = useIncomeStats(month)

  const filtered = useMemo(
    () => (incomes ?? []).filter((i) => categoryFilter === 'all' || i.category === categoryFilter),
    [incomes, categoryFilter]
  )

  if (isError) {
    return (
      <Alert variant="destructive" className="rounded-xl bg-danger/10 px-4 py-3">
        <AlertDescription>收入資料載入失敗，請重新整理頁面</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-floral-white">收入</h1>
          <p className="mt-1 text-sm text-text-muted">記錄收入並反映到帳戶餘額</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="rounded-xl">
          ＋ 新增收入
        </Button>
      </div>

      <Card className="mb-6 rounded-3xl bg-[linear-gradient(160deg,rgba(30,174,152,0.1),rgba(169,241,223,0.05))] ring-1 ring-inset ring-[rgba(30,174,152,0.16)] backdrop-blur-md [--card-spacing:--spacing(5)]">
        <CardContent className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted">本月收入</p>
            <p className="mt-1 bg-[linear-gradient(135deg,#1EAE98,#A9F1DF)] bg-clip-text text-3xl font-bold tabular-nums text-transparent">
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

      <div className="mb-4 flex flex-wrap gap-1.5">
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
        {INCOME_CATEGORIES.map((c) => (
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
            {INCOME_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="flex justify-center py-24">
          <Spinner className="size-8 text-primary" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((income) => (
            <IncomeCard key={income.id} income={income} />
          ))}
        </div>
      ) : (
        <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
          <CardContent className="py-8 text-center">
            <p className="text-5xl sm:text-7xl" aria-hidden="true">
              💰
            </p>
            <p className="mt-6 font-medium text-floral-white">
              {categoryFilter === 'all'
                ? '這個月還沒有收入紀錄'
                : `這個月還沒有${INCOME_CATEGORY_LABELS[categoryFilter]}收入紀錄`}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              記下薪資、獎金、退款等進帳，帳戶餘額會自動更新
            </p>
            <Button onClick={() => setFormOpen(true)} size="lg" className="mt-6 rounded-xl px-6">
              新增收入
            </Button>
          </CardContent>
        </Card>
      )}

      <IncomeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        income={null}
        defaultCategory={categoryFilter === 'all' ? undefined : categoryFilter}
      />
    </div>
  )
}
