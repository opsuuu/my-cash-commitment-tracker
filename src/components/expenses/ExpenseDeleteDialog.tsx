import { toast } from 'sonner'
import { useDeleteExpense, type Expense } from '@/hooks/useExpenses'
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

interface ExpenseDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
}

export default function ExpenseDeleteDialog({
  open,
  onOpenChange,
  expense,
}: ExpenseDeleteDialogProps) {
  const deleteExpense = useDeleteExpense()

  if (!expense) return null

  const handleDelete = async () => {
    try {
      await deleteExpense.mutateAsync(expense.id)
      toast.success('支出已刪除')
      onOpenChange(false)
    } catch {
      toast.error('刪除失敗，請稍後再試')
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>刪除這筆支出？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <span className="block">
                刪除後，這筆{' '}
                <span className="font-semibold text-floral-white">
                  {formatCurrency(expense.amount)}
                </span>{' '}
                會回補到扣款帳戶餘額，預算池消耗也會回退。
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
            disabled={deleteExpense.isPending}
          >
            {deleteExpense.isPending ? '刪除中...' : '確認刪除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
