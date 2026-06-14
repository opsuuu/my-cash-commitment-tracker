import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useSettleCommitment,
  type Commitment,
  type CommitmentSchedule,
} from '@/hooks/useCommitments'
import { useAccounts } from '@/hooks/useAccounts'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormSelect, FormField, type FormSelectOption } from '@/components/common'
import { cn } from '@/lib/utils'

const chargeSchema = z.object({
  accountId: z.string().min(1, '請選擇扣款帳戶'),
  actualAmount: z.number('請輸入有效金額').positive('金額需大於 0'),
  chargeDate: z.string().min(1, '請選擇扣款日期'),
  note: z.string().optional(),
})

type ChargeFormValues = z.infer<typeof chargeSchema>

interface ChargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  commitment: Commitment | null
  /** 有值代表結算分期某一期；否則結算一次性承諾 */
  schedule?: CommitmentSchedule | null
}

const numberField = {
  setValueAs: (v: unknown) => (v === '' || v === undefined ? undefined : Number(v)),
}

const inputClass = 'h-11 rounded-xl bg-white/5 px-4 md:text-base'
const selectClass = 'w-full rounded-xl bg-white/5 px-4 data-[size=default]:h-11 md:text-base'

export default function ChargeDialog({
  open,
  onOpenChange,
  commitment,
  schedule,
}: ChargeDialogProps) {
  const settle = useSettleCommitment()
  const { data: accounts } = useAccounts()

  const estimated = schedule ? schedule.amount : (commitment?.amount ?? 0)

  const accountOptions: FormSelectOption[] = (accounts ?? [])
    .filter((a) => a.is_active)
    .map((a) => ({
      value: a.id,
      label:
        a.type === 'credit_card'
          ? `${a.name}（未繳 ${formatCurrency(-a.balance)}）`
          : `${a.name}（餘額 ${formatCurrency(a.balance)}）`,
    }))

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeSchema),
  })

  const actualAmount = useWatch({ control, name: 'actualAmount' })
  const diff = typeof actualAmount === 'number' ? actualAmount - estimated : 0

  useEffect(() => {
    if (open && commitment) {
      reset({
        accountId: '',
        actualAmount: estimated,
        chargeDate: new Date().toISOString().slice(0, 10),
        note: '',
      })
    }
  }, [open, commitment, schedule, estimated, reset])

  if (!commitment) return null

  const onSubmit = async (data: ChargeFormValues) => {
    try {
      await settle.mutateAsync({
        commitmentId: commitment.id,
        scheduleId: schedule?.id ?? null,
        accountId: data.accountId,
        actualAmount: data.actualAmount,
        chargeDate: data.chargeDate,
        note: data.note || null,
      })
      toast.success('已標記扣款，已建立對應支出並更新帳戶餘額')
      onOpenChange(false)
    } catch (error) {
      const message = (error as { message?: string }).message
      toast.error(message ? `扣款失敗：${message}` : '扣款失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{schedule ? '標記此期已扣款' : '標記已扣款'}</DialogTitle>
          <DialogDescription>
            {commitment.title}・預估 {formatCurrency(estimated)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="扣款帳戶" error={errors.accountId?.message}>
            <FormSelect
              control={control}
              name="accountId"
              options={accountOptions}
              placeholder="選擇扣款帳戶"
              invalid={!!errors.accountId}
              className={selectClass}
            />
          </FormField>

          <FormField
            label="實際扣款金額"
            htmlFor="charge-amount"
            error={errors.actualAmount?.message}
          >
            <Input
              id="charge-amount"
              type="number"
              step="any"
              min="0"
              aria-invalid={errors.actualAmount ? true : undefined}
              className={inputClass}
              {...register('actualAmount', numberField)}
            />
            {diff !== 0 && !Number.isNaN(diff) && (
              <p className="mt-1 text-xs text-text-muted">
                與預估差額：
                <span className={cn('font-medium', diff > 0 ? 'text-risk-soft' : 'text-safe')}>
                  {diff > 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(diff))}
                </span>
              </p>
            )}
          </FormField>

          <FormField label="扣款日期" htmlFor="charge-date" error={errors.chargeDate?.message}>
            <Input
              id="charge-date"
              type="date"
              aria-invalid={errors.chargeDate ? true : undefined}
              className={inputClass}
              {...register('chargeDate')}
            />
          </FormField>

          <FormField label="備註（選填）" htmlFor="charge-note">
            <Input
              id="charge-note"
              placeholder="補充說明"
              className={inputClass}
              {...register('note')}
            />
          </FormField>

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
              {isSubmitting ? '處理中...' : '確認扣款'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
