import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateIncome, useUpdateIncome, type Income } from '@/hooks/useIncomes'
import { useAccounts } from '@/hooks/useAccounts'
import { useCommitments } from '@/hooks/useCommitments'
import { getToday } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import { INCOME_CATEGORIES, INCOME_CATEGORY_LABELS, type IncomeCategory } from '@/constants/incomes'
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

const incomeSchema = z.object({
  date: z.string().min(1, '請選擇日期'),
  amount: z.number('請輸入有效金額').positive('金額需大於 0'),
  accountId: z.string().min(1, '請選擇入帳帳戶'),
  category: z.enum(INCOME_CATEGORIES),
  relatedCommitmentId: z.string().optional(),
  note: z.string().optional(),
})

type IncomeFormValues = z.infer<typeof incomeSchema>

/** 表單值 → DB payload。related_commitment_id 僅在退款類別保留。 */
function toPayload(data: IncomeFormValues): Omit<TablesInsert<'incomes'>, 'user_id'> {
  return {
    date: data.date,
    amount: data.amount,
    account_id: data.accountId,
    category: data.category,
    related_commitment_id: data.category === 'refund' ? data.relatedCommitmentId || null : null,
    note: data.note || null,
  }
}

function toFormValues(
  income: Income | null | undefined,
  defaultCategory?: IncomeCategory
): IncomeFormValues {
  return {
    date: income?.date ?? getToday(),
    amount: income?.amount ?? (undefined as unknown as number),
    accountId: income?.account_id ?? '',
    category: (income?.category as IncomeCategory) ?? defaultCategory ?? 'salary',
    relatedCommitmentId: income?.related_commitment_id ?? undefined,
    note: income?.note ?? undefined,
  }
}

interface IncomeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income?: Income | null
  /** 建立模式的預選類別（從某類別分頁點新增時帶入） */
  defaultCategory?: IncomeCategory
}

const numberField = {
  setValueAs: (v: unknown) => (v === '' || v === undefined ? undefined : Number(v)),
}

const CATEGORY_OPTIONS: FormSelectOption[] = INCOME_CATEGORIES.map((c) => ({
  value: c,
  label: INCOME_CATEGORY_LABELS[c],
}))

const inputClass = 'h-11 rounded-xl bg-white/5 px-4 md:text-base'
const selectClass = 'w-full rounded-xl bg-white/5 px-4 data-[size=default]:h-11 md:text-base'

export default function IncomeFormDialog({
  open,
  onOpenChange,
  income,
  defaultCategory,
}: IncomeFormDialogProps) {
  const navigate = useNavigate()
  const isEdit = !!income
  const createIncome = useCreateIncome()
  const updateIncome = useUpdateIncome()
  const { data: accounts } = useAccounts()
  const { data: commitments } = useCommitments()

  const commitmentOptions: FormSelectOption[] = (commitments ?? []).map((c) => ({
    value: c.id,
    label: c.title,
  }))

  const goCreateAccount = () => {
    onOpenChange(false)
    navigate('/accounts')
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { category: 'salary' },
  })

  const selectedCategory = useWatch({ control, name: 'category' })
  const selectedAccountId = useWatch({ control, name: 'accountId' })

  // 一般收入不該入帳到信用卡（薪水存進信用卡無意義）；只有「退款」例外——
  // 信用卡刷的退款會退回該卡、減少卡債（Ledger 下即 +金額）。
  const allowCreditCard = selectedCategory === 'refund'
  const accountOptions: FormSelectOption[] = (accounts ?? [])
    .filter((a) => a.is_active && (allowCreditCard || a.type !== 'credit_card'))
    .map((a) => ({
      value: a.id,
      label:
        a.type === 'credit_card'
          ? `${a.name}（未繳 ${formatCurrency(-a.current_balance)}）`
          : `${a.name}（餘額 ${formatCurrency(a.current_balance)}）`,
    }))
  const hasNoAccounts = accountOptions.length === 0

  useEffect(() => {
    if (open) reset(toFormValues(income, defaultCategory))
  }, [open, income, defaultCategory, reset])

  // 從退款切到其他類別時，若已選了信用卡帳戶就清掉，避免送出「一般收入入帳信用卡」
  useEffect(() => {
    if (!allowCreditCard && selectedAccountId) {
      const selected = accounts?.find((a) => a.id === selectedAccountId)
      if (selected?.type === 'credit_card') setValue('accountId', '')
    }
  }, [allowCreditCard, selectedAccountId, accounts, setValue])

  const onSubmit = async (data: IncomeFormValues) => {
    const payload = toPayload(data)
    try {
      if (isEdit) {
        await updateIncome.mutateAsync({ id: income.id, ...payload })
        toast.success('收入已更新')
      } else {
        await createIncome.mutateAsync(payload)
        toast.success('收入已建立')
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
          <DialogTitle>{isEdit ? '編輯收入' : '新增收入'}</DialogTitle>
          <DialogDescription>記錄一筆收入，入帳帳戶餘額會自動反映。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="日期" htmlFor="income-date" error={errors.date?.message}>
              <Input
                id="income-date"
                type="date"
                aria-invalid={errors.date ? true : undefined}
                className={inputClass}
                {...register('date')}
              />
            </FormField>
            <FormField label="金額" htmlFor="income-amount" error={errors.amount?.message}>
              <Input
                id="income-amount"
                type="number"
                step="any"
                min="0"
                aria-invalid={errors.amount ? true : undefined}
                className={inputClass}
                {...register('amount', numberField)}
              />
            </FormField>
          </div>

          <FormField label="入帳帳戶" error={hasNoAccounts ? undefined : errors.accountId?.message}>
            {hasNoAccounts ? (
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-sm text-text-secondary">
                  你還沒有任何帳戶，收入需要指定一個入帳帳戶。
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={goCreateAccount}
                  className="mt-2 rounded-lg"
                >
                  前往建立帳戶
                </Button>
              </div>
            ) : (
              <FormSelect
                control={control}
                name="accountId"
                options={accountOptions}
                placeholder="選擇入帳帳戶"
                invalid={!!errors.accountId}
                className={selectClass}
              />
            )}
          </FormField>

          <FormField label="類別">
            <FormSelect
              control={control}
              name="category"
              options={CATEGORY_OPTIONS}
              className={selectClass}
            />
          </FormField>

          {selectedCategory === 'refund' && (
            <FormField label="對應承諾支出（選填）">
              <FormSelect
                control={control}
                name="relatedCommitmentId"
                options={commitmentOptions}
                placeholder="選擇這筆退款對應的承諾"
                className={selectClass}
              />
              <p className="mt-1 text-xs text-text-muted">
                標記這筆退款是哪一筆承諾支出退回來的，方便日後對帳。
              </p>
            </FormField>
          )}

          <FormField label="備註（選填）" htmlFor="income-note">
            <Input
              id="income-note"
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
            <Button type="submit" disabled={isSubmitting || hasNoAccounts} className="rounded-xl">
              {isSubmitting ? '儲存中...' : isEdit ? '儲存變更' : '建立收入'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
