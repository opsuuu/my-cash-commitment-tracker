import { useMemo, useState } from 'react'
import { HelpCircleIcon } from 'lucide-react'
import { useCommitments, useCommitmentStats } from '@/hooks/useCommitments'
import { useDismissible } from '@/hooks/useDismissible'
import { formatCurrency } from '@/lib/format'
import CommitmentCard from '@/components/commitments/CommitmentCard'
import CommitmentFormDialog from '@/components/commitments/CommitmentFormDialog'
import CommitmentConceptCallout from '@/components/commitments/CommitmentConceptCallout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: '全部', match: () => true },
  { key: 'open', label: '待處理', match: (s: string) => s === 'pending' || s === 'active' },
  { key: 'done', label: '已完成', match: (s: string) => s === 'charged' || s === 'completed' },
  { key: 'cancelled', label: '已取消', match: (s: string) => s === 'cancelled' },
] as const

export default function CommitmentsPage() {
  const { data: commitments, isPending, isError } = useCommitments()
  const { data: stats } = useCommitmentStats()

  const [formOpen, setFormOpen] = useState(false)
  const [filterKey, setFilterKey] = useState<(typeof FILTERS)[number]['key']>('all')
  const [search, setSearch] = useState('')
  const intro = useDismissible('commitments-intro')

  const filtered = useMemo(() => {
    const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0]
    const keyword = search.trim().toLowerCase()
    return (commitments ?? []).filter(
      (c) => filter.match(c.status) && (!keyword || c.title.toLowerCase().includes(keyword))
    )
  }, [commitments, filterKey, search])

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
        <AlertDescription>承諾支出資料載入失敗，請重新整理頁面</AlertDescription>
      </Alert>
    )
  }

  const hasAny = (commitments ?? []).length > 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-floral-white">承諾支出</h1>
          <p className="mt-1 text-sm text-text-muted">已承諾但尚未扣款的支出</p>
        </div>
        <div className="flex items-center gap-2">
          {intro.dismissed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={intro.reopen}
              aria-label="重看承諾支出說明"
              className="size-9 rounded-full text-text-muted hover:text-floral-white"
            >
              <HelpCircleIcon className="size-5" />
            </Button>
          )}
          <Button onClick={() => setFormOpen(true)} className="rounded-xl">
            ＋ 新增承諾
          </Button>
        </div>
      </div>

      {!intro.dismissed && <CommitmentConceptCallout onDismiss={intro.dismiss} />}

      {hasAny ? (
        <>
          <Card className="mb-6 rounded-3xl bg-[linear-gradient(160deg,rgba(255,140,140,0.08),rgba(192,185,221,0.05))] ring-1 ring-inset ring-[rgba(255,140,140,0.14)] backdrop-blur-md [--card-spacing:--spacing(5)]">
            <CardContent>
              <p className="text-xs text-text-muted">總承諾金額（待扣款）</p>
              <p className="mt-1 bg-[linear-gradient(135deg,#FF8C8C,#F1EAB9)] bg-clip-text text-3xl font-bold tabular-nums text-transparent">
                {formatCurrency(stats?.pendingTotal ?? 0)}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                共 {stats?.pendingCount ?? 0} 筆鎖住可用資金的承諾
              </p>
            </CardContent>
          </Card>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterKey(f.key)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm transition',
                    filterKey === f.key
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-text-secondary hover:bg-muted hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋名稱..."
              className="h-10 rounded-xl bg-white/5 px-4 sm:max-w-xs"
            />
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((commitment) => (
                <CommitmentCard key={commitment.id} commitment={commitment} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-text-muted">沒有符合條件的承諾支出</p>
          )}
        </>
      ) : (
        <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
          <CardContent className="py-8 text-center">
            <p className="text-5xl sm:text-7xl" aria-hidden="true">
              📌
            </p>
            <p className="mt-6 font-medium text-floral-white">還沒有任何承諾支出</p>
            <p className="mt-1 text-sm text-text-muted">
              把「已經答應要花、但還沒扣款」的支出記下來，避免誤把餘額當成能自由運用的錢
            </p>
            <Button onClick={() => setFormOpen(true)} size="lg" className="mt-6 rounded-xl px-6">
              新增承諾支出
            </Button>
          </CardContent>
        </Card>
      )}

      <CommitmentFormDialog open={formOpen} onOpenChange={setFormOpen} commitment={null} />
    </div>
  )
}
