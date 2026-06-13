import { XIcon } from 'lucide-react'
import { POOL_TYPE_EMOJIS } from '@/constants/budgetPools'
import { Button } from '@/components/ui/button'

interface PoolConceptCalloutProps {
  onDismiss: () => void
}

/**
 * 首次進入預算池頁的概念教學卡。重點不是操作步驟，而是兩個反直覺的觀念：
 * 1) 支出池 vs 儲蓄池的用途差別 2) 承諾支出「建立當下就鎖住可用餘額」。
 * 顯示與否由父層的 useDismissible 控制。
 */
export default function PoolConceptCallout({ onDismiss }: PoolConceptCalloutProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,rgba(192,185,221,0.16),rgba(128,161,212,0.08))] p-5 ring-1 ring-inset ring-periwinkle/25 backdrop-blur-md sm:p-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="關閉教學"
        className="absolute top-3 right-3 size-8 rounded-full text-text-muted hover:text-floral-white"
      >
        <XIcon className="size-4" />
      </Button>

      <p className="flex items-center gap-2 font-semibold text-floral-white">
        <span aria-hidden="true">👋</span>
        第一次使用預算池？
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-sm font-medium text-floral-white">
            <span className="mr-1.5" aria-hidden="true">
              {POOL_TYPE_EMOJIS.spending}
            </span>
            支出池
          </p>
          <p className="mt-1 text-xs leading-relaxed text-lavender">
            設定每月花費上限，隨著支出與承諾即時看還剩多少能花。
          </p>
        </div>
        <div className="rounded-2xl bg-white/5 p-3">
          <p className="text-sm font-medium text-floral-white">
            <span className="mr-1.5" aria-hidden="true">
              {POOL_TYPE_EMOJIS.saving}
            </span>
            儲蓄池
          </p>
          <p className="mt-1 text-xs leading-relaxed text-lavender">
            設定一個目標金額，追蹤離存到目標還差多少、進度到哪了。
          </p>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-periwinkle/10 px-4 py-3 text-sm leading-relaxed text-lavender">
        <span className="mr-1" aria-hidden="true">
          💡
        </span>
        最重要的一點：每一筆「承諾支出」會在你
        <strong className="font-semibold text-floral-white mx-1">建立的當下</strong>
        就從可用餘額鎖住 — 就算還沒真的扣款，這筆錢已經不算你能自由運用的錢了。
      </p>

      <p className="mt-4 rounded-2xl bg-periwinkle/10 px-4 py-3 text-sm leading-relaxed text-lavender">
        <span className="mr-1" aria-hidden="true">
          📌
        </span>
        預算池建立一次就會一直存在，每個月自動沿用、不需要重建；之後隨時可以編輯額度或刪除。
      </p>

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onDismiss} className="rounded-lg">
          我知道了
        </Button>
      </div>
    </div>
  )
}
