import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAdjustBalance, type Account } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// 信用卡的「未繳金額」在 UI 一律以正數輸入，存檔時才轉為負數（資料層以負數代表欠款）
const adjustBalanceSchema = z.object({
  newBalance: z.number('請輸入有效金額').min(0, '金額不可為負數'),
  reason: z.string().min(1, '請填寫調整原因'),
})

interface AdjustBalanceFormValues {
  newBalance: number
  reason: string
}

interface AdjustBalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
}

export default function AdjustBalanceDialog({
  open,
  onOpenChange,
  account,
}: AdjustBalanceDialogProps) {
  const adjustBalance = useAdjustBalance()
  const isCreditCard = account?.type === 'credit_card'
  // UI 顯示值：信用卡將負數欠款轉為正數的「未繳金額」
  const displayBalance = account ? (isCreditCard ? -account.balance : account.balance) : 0

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdjustBalanceFormValues>({
    resolver: zodResolver(adjustBalanceSchema),
  })

  useEffect(() => {
    if (open && account) {
      reset({
        newBalance: isCreditCard ? -account.balance : account.balance,
        reason: '',
      })
    }
  }, [open, account, isCreditCard, reset])

  const newBalance = watch('newBalance')
  const diff = typeof newBalance === 'number' ? newBalance - displayBalance : 0
  // 信用卡未繳金額增加 = 財務變差；一般帳戶餘額增加 = 財務變好
  const diffIsGood = isCreditCard ? diff < 0 : diff > 0

  if (!account) return null

  const onSubmit = async (data: AdjustBalanceFormValues) => {
    try {
      await adjustBalance.mutateAsync({
        account,
        newBalance: isCreditCard ? -data.newBalance : data.newBalance,
        reason: data.reason,
      })
      toast.success(isCreditCard ? '未繳金額已調整' : '餘額已調整')
      onOpenChange(false)
    } catch {
      toast.error('調整失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isCreditCard ? '調整未繳金額' : '調整餘額'}</DialogTitle>
          <DialogDescription>
            {account.name}・目前{isCreditCard ? '未繳' : '餘額'} {formatCurrency(displayBalance)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="adjust-balance" className="mb-2 text-lavender">
              {isCreditCard ? '調整後未繳金額' : '調整後餘額'}
            </Label>
            <Input
              id="adjust-balance"
              type="number"
              step="any"
              min="0"
              aria-invalid={errors.newBalance ? true : undefined}
              className="h-11 rounded-xl bg-white/5 px-4 md:text-base"
              {...register('newBalance', {
                setValueAs: (v) => (v === '' ? undefined : Number(v)),
              })}
            />
            {diff !== 0 && !Number.isNaN(diff) && (
              <p className="mt-1 text-xs text-text-muted">
                {isCreditCard ? '未繳金額' : '餘額'}
                {diff > 0 ? '增加' : '減少'}：
                <span className={diffIsGood ? 'text-safe' : 'text-danger'}>
                  {formatCurrency(Math.abs(diff))}
                </span>
              </p>
            )}
            {errors.newBalance && (
              <p className="mt-1 text-xs text-danger">{errors.newBalance.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="adjust-reason" className="mb-2 text-lavender">
              調整原因
            </Label>
            <Input
              id="adjust-reason"
              placeholder={
                isCreditCard ? '例如：繳款入帳、新增刷卡消費' : '例如：對帳差額、漏記支出'
              }
              aria-invalid={errors.reason ? true : undefined}
              className="h-11 rounded-xl bg-white/5 px-4 md:text-base"
              {...register('reason')}
            />
            {errors.reason && <p className="mt-1 text-xs text-danger">{errors.reason.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl bg-transparent"
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? '調整中...' : '確認調整'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
