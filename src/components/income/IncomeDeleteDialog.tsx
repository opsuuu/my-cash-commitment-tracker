import { toast } from 'sonner'
import { useDeleteIncome, type Income } from '@/hooks/useIncomes'
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

interface IncomeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income: Income | null
}

export default function IncomeDeleteDialog({
  open,
  onOpenChange,
  income,
}: IncomeDeleteDialogProps) {
  const deleteIncome = useDeleteIncome()

  if (!income) return null

  const handleDelete = async () => {
    try {
      await deleteIncome.mutateAsync(income.id)
      toast.success('收入已刪除')
      onOpenChange(false)
    } catch {
      toast.error('刪除失敗，請稍後再試')
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>刪除這筆收入？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <span className="block">
                刪除後，這筆{' '}
                <span className="font-semibold text-safe">{formatCurrency(income.amount)}</span>{' '}
                會從入帳帳戶餘額扣回。
              </span>
              <span className="mt-2 block text-xs">此操作無法復原。</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>返回</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteIncome.isPending}
          >
            {deleteIncome.isPending ? '刪除中...' : '確認刪除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
