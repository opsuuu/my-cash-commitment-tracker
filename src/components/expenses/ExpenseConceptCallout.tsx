import { XIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface ExpenseConceptCalloutProps {
  onDismiss: () => void
}

/**
 * 首次進入支出頁的概念教學卡。重點：每筆支出都要歸屬一個預算池，
 * 「類別」是花在什麼、「預算池」是從哪個規劃區塊扣，建議先把消費區塊建好再來記。
 * 顯示與否由父層的 useDismissible 控制。
 */
export default function ExpenseConceptCallout({ onDismiss }: ExpenseConceptCalloutProps) {
  const navigate = useNavigate()

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
        第一次使用支出？
      </p>

      <p className="mt-3 text-sm leading-relaxed text-lavender">
        每一筆支出都必須
        <strong className="mx-1 font-semibold text-floral-white">歸屬一個預算池</strong>
        ——把實際花費對應到你規劃好的消費區塊，才能即時看出每個區塊還剩多少能花。
      </p>

      <p className="mt-4 rounded-2xl bg-periwinkle/10 px-4 py-3 text-sm leading-relaxed text-lavender">
        <span className="mr-1" aria-hidden="true">
          💡
        </span>
        「類別」是<strong className="mx-1 font-semibold text-floral-white">花在什麼</strong>
        、「預算池」是
        <strong className="mx-1 font-semibold text-floral-white">從哪個規劃區塊扣</strong>
        。例如：飲食類別 → 生活開銷池、娛樂類別 → 動漫週邊池、保健食品 →
        你自訂的保健池——怎麼分，由你的消費習慣決定。
      </p>

      <p className="mt-4 rounded-2xl bg-periwinkle/10 px-4 py-3 text-sm leading-relaxed text-lavender">
        <span className="mr-1" aria-hidden="true">
          📌
        </span>
        建議順序：先到「預算池」把自己的消費區塊與額度建好，再回來這裡記支出，各池剩餘才算得準。
      </p>

      <p className="mt-4 text-sm leading-relaxed text-lavender rounded-2xl bg-periwinkle/10 px-4 py-3">
        <span className="mr-1" aria-hidden="true">
          🔗
        </span>
        從承諾來的支出：你的「承諾支出」要在承諾頁點「標記已扣款」後，才會變成這裡的一筆支出（標示
        「來自承諾」 ）；只是建立承諾、還沒扣款時不會出現在這裡。
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/budget-pools')}
          className="rounded-lg bg-transparent"
        >
          先去設定預算池
        </Button>
        <Button variant="secondary" size="sm" onClick={onDismiss} className="rounded-lg">
          我知道了
        </Button>
      </div>
    </div>
  )
}
