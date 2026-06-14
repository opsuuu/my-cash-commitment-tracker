import { toast } from 'sonner'
import {
  useCancelCommitment,
  useCommitmentSchedules,
  type Commitment,
} from '@/hooks/useCommitments'
import { formatCurrency } from '@/lib/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface CancelCommitmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commitment: Commitment | null
}

export default function CancelCommitmentDialog({
  open,
  onOpenChange,
  commitment,
}: CancelCommitmentDialogProps) {
  const cancelCommitment = useCancelCommitment()
  const isInstallment = commitment?.type === 'installment'
  // 分期才需要查未扣期程算退回金額
  const { data: schedules } = useCommitmentSchedules(
    open && isInstallment ? (commitment?.id ?? null) : null
  )

  if (!commitment) return null

  const pendingSchedules = (schedules ?? []).filter((s) => s.status === 'pending')
  const refundAmount = isInstallment
    ? pendingSchedules.reduce((sum, s) => sum + s.amount, 0)
    : commitment.amount

  const handleCancel = async () => {
    try {
      await cancelCommitment.mutateAsync({ id: commitment.id, type: commitment.type })
      toast.success('承諾支出已取消')
      onOpenChange(false)
    } catch {
      toast.error('取消失敗，請稍後再試')
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>取消「{commitment.title}」？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <span className="block">承諾記錄會保留，狀態改為「已取消」，不會刪除。</span>
              <span className="mt-2 block">
                {isInstallment ? (
                  <>
                    取消後剩餘 {pendingSchedules.length} 期（共{' '}
                    <span className="font-semibold text-safe">{formatCurrency(refundAmount)}</span>
                    ）回到可用資金。
                  </>
                ) : (
                  <>
                    取消後{' '}
                    <span className="font-semibold text-safe">+{formatCurrency(refundAmount)}</span>{' '}
                    回到可用資金。
                  </>
                )}
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>返回</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelCommitment.isPending}
          >
            {cancelCommitment.isPending ? '取消中...' : '確認取消'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
