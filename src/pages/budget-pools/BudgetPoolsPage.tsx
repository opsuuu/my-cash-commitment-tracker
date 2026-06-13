import { useState } from 'react'
import { HelpCircleIcon } from 'lucide-react'
import { useBudgetPools, useSpendingMonthStats, type BudgetPool } from '@/hooks/useBudgetPools'
import { useAccounts } from '@/hooks/useAccounts'
import { useDismissible } from '@/hooks/useDismissible'
import { getCurrentMonth } from '@/lib/date'
import { type PoolType } from '@/constants/budgetPools'
import SpendingPoolCard from '@/components/budget-pools/SpendingPoolCard'
import SavingPoolCard from '@/components/budget-pools/SavingPoolCard'
import BudgetPoolFormDialog from '@/components/budget-pools/BudgetPoolFormDialog'
import DeletePoolDialog from '@/components/budget-pools/DeletePoolDialog'
import PoolConceptCallout from '@/components/budget-pools/PoolConceptCallout'
import PoolEmptyState from '@/components/budget-pools/PoolEmptyState'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'

export default function BudgetPoolsPage() {
  const currentMonth = getCurrentMonth()
  const { data: pools, isPending, isError } = useBudgetPools()
  const { data: stats } = useSpendingMonthStats(currentMonth)
  const { data: accounts } = useAccounts()

  const [formOpen, setFormOpen] = useState(false)
  const [editingPool, setEditingPool] = useState<BudgetPool | null>(null)
  const [createType, setCreateType] = useState<PoolType | undefined>()
  const [deletingPool, setDeletingPool] = useState<BudgetPool | null>(null)
  const intro = useDismissible('budget-pools-intro')

  const spendingPools = pools?.filter((p) => p.type === 'spending') ?? []
  const savingPools = pools?.filter((p) => p.type === 'saving') ?? []

  const openCreate = (type?: PoolType) => {
    setEditingPool(null)
    setCreateType(type)
    setFormOpen(true)
  }

  const openEdit = (pool: BudgetPool) => {
    setEditingPool(pool)
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
        <AlertDescription>預算池資料載入失敗，請重新整理頁面</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-floral-white">預算池</h1>
          <p className="mt-1 text-sm text-text-muted">{currentMonth} 月度</p>
        </div>
        <div className="flex items-center gap-2">
          {intro.dismissed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={intro.reopen}
              aria-label="重看預算池說明"
              className="size-9 rounded-full text-text-muted hover:text-floral-white"
            >
              <HelpCircleIcon className="size-5" />
            </Button>
          )}
          <Button onClick={() => openCreate()} className="rounded-xl">
            ＋ 新增預算池
          </Button>
        </div>
      </div>

      {!intro.dismissed && <PoolConceptCallout onDismiss={intro.dismiss} />}

      {spendingPools.length === 0 && savingPools.length === 0 ? (
        <PoolEmptyState onCreate={openCreate} />
      ) : (
        <div className="space-y-10">
          {spendingPools.length > 0 && (
            <section className="rounded-3xl bg-[linear-gradient(160deg,rgba(241,234,185,0.06),rgba(255,140,140,0.04))] p-5 ring-1 ring-inset ring-[rgba(255,140,140,0.12)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-9 w-1 rounded-full bg-[linear-gradient(180deg,#F1EAB9,#FF8C8C)]" />
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-floral-white">
                    支出池
                    <span className="rounded-full bg-[rgba(255,140,140,0.18)] px-2 py-0.5 text-xs font-medium tabular-nums text-[#FF8C8C]">
                      {spendingPools.length}
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted">管理每月花費上限</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {spendingPools.map((pool) => (
                  <SpendingPoolCard
                    key={pool.id}
                    pool={pool}
                    stats={stats?.[pool.id]}
                    onEdit={openEdit}
                    onDelete={setDeletingPool}
                  />
                ))}
              </div>
            </section>
          )}

          {savingPools.length > 0 && (
            <section className="rounded-3xl bg-[linear-gradient(160deg,rgba(216,181,255,0.07),rgba(30,174,152,0.04))] p-5 ring-1 ring-inset ring-[rgba(216,181,255,0.15)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-9 w-1 rounded-full bg-[linear-gradient(180deg,#D8B5FF,#1EAE98)]" />
                <div>
                  <h2 className="flex items-center gap-2 font-semibold text-floral-white">
                    儲蓄池
                    <span className="rounded-full bg-[rgba(216,181,255,0.2)] px-2 py-0.5 text-xs font-medium tabular-nums text-[#D8B5FF]">
                      {savingPools.length}
                    </span>
                  </h2>
                  <p className="text-xs text-text-muted">追蹤目標存款進度</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {savingPools.map((pool) => (
                  <SavingPoolCard
                    key={pool.id}
                    pool={pool}
                    accounts={accounts ?? []}
                    onEdit={openEdit}
                    onDelete={setDeletingPool}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <BudgetPoolFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        pool={editingPool}
        defaultType={createType}
      />
      <DeletePoolDialog
        open={!!deletingPool}
        onOpenChange={(open) => !open && setDeletingPool(null)}
        pool={deletingPool}
      />
    </div>
  )
}
