import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateCommitment, useUpdateCommitment, type Commitment } from '@/hooks/useCommitments'
import { useBudgetPools } from '@/hooks/useBudgetPools'
import { getCurrentMonth, getToday } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import {
  COMMITMENT_TYPES,
  COMMITMENT_TYPE_LABELS,
  COMMITMENT_PRIORITIES,
  COMMITMENT_PRIORITY_LABELS,
  type CommitmentType,
  type CommitmentPriority,
} from '@/constants/commitments'
import { POOL_TYPE_EMOJIS, type PoolType } from '@/constants/budgetPools'
import type { TablesInsert } from '@/types/database.types'
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

const commitmentSchema = z
  .object({
    title: z.string().min(1, '請輸入名稱'),
    budgetPoolId: z.string().min(1, '請選擇預算池'),
    type: z.enum(COMMITMENT_TYPES),
    priority: z.enum(COMMITMENT_PRIORITIES),
    amount: z.number('請輸入有效金額').positive('金額需大於 0'),
    orderDate: z.string().min(1, '請選擇下單日期'),
    expectedChargeDate: z.string().optional(),
    installmentCount: z
      .number('請輸入期數')
      .int('期數需為整數')
      .positive('期數需大於 0')
      .optional(),
    startMonth: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'installment') {
      if (data.installmentCount === undefined) {
        ctx.addIssue({ code: 'custom', path: ['installmentCount'], message: '請輸入期數' })
      }
      if (!data.startMonth) {
        ctx.addIssue({ code: 'custom', path: ['startMonth'], message: '請選擇開始月份' })
      }
    }
  })

type CommitmentFormValues = z.infer<typeof commitmentSchema>

/** 表單值 → DB payload。不含 status：建立由 DB 預設 'pending'，更新則保留原狀態不動。 */
function toPayload(data: CommitmentFormValues): Omit<TablesInsert<'commitments'>, 'user_id'> {
  const isInstallment = data.type === 'installment'
  return {
    title: data.title,
    budget_pool_id: data.budgetPoolId,
    type: data.type,
    priority: data.priority,
    amount: data.amount,
    order_date: data.orderDate,
    expected_charge_date: isInstallment ? null : data.expectedChargeDate || null,
    installment_count: isInstallment ? data.installmentCount : null,
    installment_amount:
      isInstallment && data.installmentCount ? data.amount / data.installmentCount : null,
    start_month: isInstallment ? data.startMonth : null,
    note: data.note || null,
  }
}

function toFormValues(commitment: Commitment | null | undefined): CommitmentFormValues {
  return {
    title: commitment?.title ?? '',
    budgetPoolId: commitment?.budget_pool_id ?? '',
    type: (commitment?.type as CommitmentType) ?? 'one_time',
    priority: (commitment?.priority as CommitmentPriority) ?? 'medium',
    amount: commitment?.amount ?? (undefined as unknown as number),
    orderDate: commitment?.order_date ?? getToday(),
    expectedChargeDate: commitment?.expected_charge_date ?? undefined,
    installmentCount: commitment?.installment_count ?? undefined,
    startMonth: commitment?.start_month ?? getCurrentMonth(),
    note: commitment?.note ?? undefined,
  }
}

interface CommitmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 有值代表編輯模式；類型建立後鎖定不可改 */
  commitment?: Commitment | null
}

const numberField = {
  setValueAs: (v: unknown) => (v === '' || v === undefined ? undefined : Number(v)),
}

const TYPE_OPTIONS: FormSelectOption[] = COMMITMENT_TYPES.map((t) => ({
  value: t,
  label: COMMITMENT_TYPE_LABELS[t],
}))
const PRIORITY_OPTIONS: FormSelectOption[] = COMMITMENT_PRIORITIES.map((p) => ({
  value: p,
  label: COMMITMENT_PRIORITY_LABELS[p],
}))

const inputClass = 'h-11 rounded-xl bg-white/5 px-4 md:text-base'
const selectClass = 'w-full rounded-xl bg-white/5 px-4 data-[size=default]:h-11 md:text-base'

export default function CommitmentFormDialog({
  open,
  onOpenChange,
  commitment,
}: CommitmentFormDialogProps) {
  const navigate = useNavigate()
  const isEdit = !!commitment
  // 4-4：分期一旦進入 active（已扣過至少一期），金額/期數/開始月份不可再改
  const lockFinancials = isEdit && commitment?.status !== 'pending'
  const createCommitment = useCreateCommitment()
  const updateCommitment = useUpdateCommitment()
  const { data: pools } = useBudgetPools()

  const poolOptions: FormSelectOption[] = (pools ?? []).map((p) => ({
    value: p.id,
    label: `${POOL_TYPE_EMOJIS[p.type as PoolType]} ${p.name}`,
  }))
  const hasNoPools = poolOptions.length === 0

  const goCreatePool = () => {
    onOpenChange(false)
    navigate('/budget-pools')
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommitmentFormValues>({
    resolver: zodResolver(commitmentSchema),
    defaultValues: { type: 'one_time', priority: 'medium' },
  })

  const selectedType = useWatch({ control, name: 'type' })
  const amount = useWatch({ control, name: 'amount' })
  const installmentCount = useWatch({ control, name: 'installmentCount' })

  const perInstallment =
    selectedType === 'installment' && amount && installmentCount ? amount / installmentCount : null

  useEffect(() => {
    if (open) reset(toFormValues(commitment))
  }, [open, commitment, reset])

  const onSubmit = async (data: CommitmentFormValues) => {
    const payload = toPayload(data)
    try {
      if (isEdit) {
        await updateCommitment.mutateAsync({ id: commitment.id, ...payload })
        toast.success('承諾支出已更新')
      } else {
        await createCommitment.mutateAsync(payload)
        toast.success('承諾支出已建立')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEdit ? '更新失敗，請稍後再試' : '建立失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '編輯承諾支出' : '新增承諾支出'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '修改承諾支出設定（類型建立後不可變更）'
              : '記錄已承諾但尚未扣款的支出，建立當下立即鎖住可用資金'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="名稱" htmlFor="commitment-title" error={errors.title?.message}>
            <Input
              id="commitment-title"
              placeholder="例如：iPhone 17、日本旅遊機票"
              aria-invalid={errors.title ? true : undefined}
              className={inputClass}
              {...register('title')}
            />
          </FormField>

          <FormField label="預算池" error={hasNoPools ? undefined : errors.budgetPoolId?.message}>
            {hasNoPools ? (
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-sm text-text-secondary">
                  你還沒有任何預算池，而每筆承諾支出都必須歸屬一個預算池。
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={goCreatePool}
                  className="mt-2 rounded-lg"
                >
                  前往建立預算池
                </Button>
              </div>
            ) : (
              <FormSelect
                control={control}
                name="budgetPoolId"
                options={poolOptions}
                placeholder="選擇歸屬的預算池"
                invalid={!!errors.budgetPoolId}
                className={selectClass}
              />
            )}
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="類型">
              <FormSelect
                control={control}
                name="type"
                options={TYPE_OPTIONS}
                disabled={isEdit}
                className={selectClass}
              />
            </FormField>
            <FormField label="優先級">
              <FormSelect
                control={control}
                name="priority"
                options={PRIORITY_OPTIONS}
                className={selectClass}
              />
            </FormField>
          </div>

          <FormField
            label={selectedType === 'installment' ? '總金額' : '金額'}
            htmlFor="commitment-amount"
            error={errors.amount?.message}
          >
            <Input
              id="commitment-amount"
              type="number"
              step="any"
              min="0"
              disabled={lockFinancials}
              aria-invalid={errors.amount ? true : undefined}
              className={inputClass}
              {...register('amount', numberField)}
            />
          </FormField>

          {selectedType === 'one_time' && (
            <>
              <FormField
                label="下單日期"
                htmlFor="commitment-order-date"
                error={errors.orderDate?.message}
              >
                <Input
                  id="commitment-order-date"
                  type="date"
                  aria-invalid={errors.orderDate ? true : undefined}
                  className={inputClass}
                  {...register('orderDate')}
                />
              </FormField>

              <FormField label="預計扣款日（選填）" htmlFor="commitment-charge-date">
                <Input
                  id="commitment-charge-date"
                  type="date"
                  className={inputClass}
                  {...register('expectedChargeDate')}
                />
                <p className="mt-1 text-xs text-text-muted">僅作提醒用途，不影響可用資金計算。</p>
              </FormField>
            </>
          )}

          {selectedType === 'installment' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="期數"
                  htmlFor="commitment-count"
                  error={errors.installmentCount?.message}
                >
                  <Input
                    id="commitment-count"
                    type="number"
                    step="1"
                    min="1"
                    disabled={lockFinancials}
                    aria-invalid={errors.installmentCount ? true : undefined}
                    className={inputClass}
                    {...register('installmentCount', numberField)}
                  />
                </FormField>
                <FormField
                  label="開始月份"
                  htmlFor="commitment-start-month"
                  error={errors.startMonth?.message}
                >
                  <Input
                    id="commitment-start-month"
                    type="month"
                    disabled={lockFinancials}
                    aria-invalid={errors.startMonth ? true : undefined}
                    className={inputClass}
                    {...register('startMonth')}
                  />
                </FormField>
              </div>
              <p className="text-xs text-text-muted">
                {perInstallment
                  ? `每期金額約 ${formatCurrency(perInstallment)}，建立後立即產生 ${installmentCount} 筆期程、全額鎖住可用資金。`
                  : '填入總金額與期數後，系統會自動平均每期金額並逐月產生期程。'}
              </p>
            </>
          )}

          <FormField label="備註（選填）" htmlFor="commitment-note">
            <Input
              id="commitment-note"
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
            <Button type="submit" disabled={isSubmitting || hasNoPools} className="rounded-xl">
              {isSubmitting ? '儲存中...' : isEdit ? '儲存變更' : '建立承諾支出'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
