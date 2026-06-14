import { XIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface CommitmentConceptCalloutProps {
  onDismiss: () => void
}

/**
 * 首次進入承諾支出頁的概念教學卡。重點是承諾與預算池「相輔相成」的關係：
 * 每筆承諾都要歸屬一個預算池，所以建議先把預算池分區塊建好再來記承諾。
 * 顯示與否由父層的 useDismissible 控制。
 */
export default function CommitmentConceptCallout({ onDismiss }: CommitmentConceptCalloutProps) {
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
        第一次使用承諾支出？
      </p>

      <p className="mt-3 text-sm leading-relaxed text-lavender">
        承諾支出 = 你已經答應要花、但還沒實際扣款的錢。它在你
        <strong className="mx-1 font-semibold text-floral-white">建立的當下</strong>
        就立即鎖住可用資金，不等真正扣款——避免你把帳戶餘額誤當成能自由運用的錢。
      </p>

      <p className="mt-4 rounded-2xl bg-periwinkle/10 px-4 py-3 text-sm leading-relaxed text-lavender">
        <span className="mr-1" aria-hidden="true">
          💡
        </span>
        承諾支出和預算池是<strong className="mx-1 font-semibold text-floral-white">相輔相成</strong>
        的：每一筆承諾都必須「歸屬一個預算池」。預算池把你的財務分成區塊（日常、娛樂、各種目標），承諾則記錄這些區塊裡「已答應、還沒付」的支出。
      </p>

      <p className="mt-4 rounded-2xl bg-periwinkle/10 px-4 py-3 text-sm leading-relaxed text-lavender">
        <span className="mr-1" aria-hidden="true">
          📌
        </span>
        建議順序：先到「預算池」把自己的財務分區塊管理好、大致完成，再回來這裡建立承諾，可用資金與各池剩餘才算得準。
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
