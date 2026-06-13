import { POOL_TYPE_EMOJIS, type PoolType } from '@/constants/budgetPools'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface PoolEmptyStateProps {
  onCreate: (type: PoolType) => void
}

/**
 * 零預算池時的空狀態。新手第一眼就是這裡，所以直接做成兩種池子的對照教學，
 * 各自帶一個建立 CTA，省去先到表單才知道差別的來回。
 */
export default function PoolEmptyState({ onCreate }: PoolEmptyStateProps) {
  return (
    <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(8)]">
      <CardContent className="py-8">
        <div className="text-center">
          <p className="text-5xl sm:text-6xl" aria-hidden="true">
            🪴
          </p>
          <p className="mt-4 text-lg font-semibold text-floral-white">建立你的第一個預算池</p>
          <p className="mt-1 text-sm text-text-muted">兩種池子各有用途，挑一個開始吧</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col rounded-3xl bg-[linear-gradient(160deg,rgba(241,234,185,0.08),rgba(255,140,140,0.05))] p-5 ring-1 ring-inset ring-[rgba(255,140,140,0.14)]">
            <p className="text-3xl" aria-hidden="true">
              {POOL_TYPE_EMOJIS.spending}
            </p>
            <p className="mt-3 font-semibold text-floral-white">支出池</p>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-lavender">
              設定每月花費上限，隨支出與承諾即時掌握還剩多少能花。
            </p>
            <Button
              onClick={() => onCreate('spending')}
              className="mt-4 rounded-xl bg-[#FF8C8C] text-[#3a1420] hover:bg-[#ff9d9d]"
            >
              建立支出池
            </Button>
          </div>

          <div className="flex flex-col rounded-3xl bg-[linear-gradient(160deg,rgba(216,181,255,0.09),rgba(30,174,152,0.05))] p-5 ring-1 ring-inset ring-[rgba(216,181,255,0.18)]">
            <p className="text-3xl" aria-hidden="true">
              {POOL_TYPE_EMOJIS.saving}
            </p>
            <p className="mt-3 font-semibold text-floral-white">儲蓄池</p>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-lavender">
              設定目標金額，追蹤離存到目標還差多少、進度到哪了。
            </p>
            <Button
              onClick={() => onCreate('saving')}
              className="mt-4 rounded-xl bg-[#D8B5FF] text-[#241a33] hover:bg-[#e2c6ff]"
            >
              建立儲蓄池
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
