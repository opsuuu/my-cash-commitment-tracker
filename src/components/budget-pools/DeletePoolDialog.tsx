import { toast } from 'sonner'
import { useDeleteBudgetPool, usePoolReferences, type BudgetPool } from '@/hooks/useBudgetPools'
import { Spinner } from '@/components/ui/spinner'
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

interface DeletePoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pool: BudgetPool | null
}

export default function DeletePoolDialog({ open, onOpenChange, pool }: DeletePoolDialogProps) {
  const deletePool = useDeleteBudgetPool()
  // isFetching 而非 isPending：背景重新驗證期間不可拿舊快取放行刪除
  const { data: refs, isFetching } = usePoolReferences(open ? (pool?.id ?? null) : null)

  if (!pool) return null

  const blockers: string[] = []
  if (refs) {
    if (refs.expenseCount > 0) blockers.push(`${refs.expenseCount} 筆支出記錄`)
    if (refs.commitmentCount > 0) blockers.push(`${refs.commitmentCount} 筆承諾支出`)
    if (refs.sweepSourceNames.length > 0)
      blockers.push(`被「${refs.sweepSourceNames.join('、')}」設為月底轉入目標`)
  }
  const canDelete = !isFetching && blockers.length === 0

  const handleDelete = async () => {
    try {
      await deletePool.mutateAsync(pool.id)
      toast.success('預算池已刪除')
      onOpenChange(false)
    } catch (error) {
      // 23503 = Postgres FK violation，前端檢查漏接時的最後防線
      if ((error as { code?: string }).code === '23503') {
        toast.error('刪除失敗：此預算池仍被其他資料引用')
      } else {
        toast.error('刪除失敗，請稍後再試')
      }
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>刪除「{pool.name}」？</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {isFetching ? (
                <span className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  檢查關聯資料中...
                </span>
              ) : blockers.length > 0 ? (
                <>
                  <span className="block">此預算池無法刪除，因為它仍有關聯資料：</span>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                  <span className="mt-2 block text-xs">
                    請先處理這些關聯（或改用其他預算池）再刪除
                  </span>
                </>
              ) : (
                <span className="block">刪除後無法復原，此池的月度分配記錄也會一併刪除。</span>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* Cancel/Action 內部是 Button asChild，className 不會經過 tailwind-merge，
              樣式一律透過 variant/size props 控制 */}
          <AlertDialogCancel>{canDelete ? '取消' : '關閉'}</AlertDialogCancel>
          {canDelete && (
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deletePool.isPending}
            >
              {deletePool.isPending ? '刪除中...' : '確認刪除'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
