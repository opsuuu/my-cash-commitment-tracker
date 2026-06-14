import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateExpense, useUpdateExpense, type Expense } from '@/hooks/useExpenses'
import { useAccounts } from '@/hooks/useAccounts'
import { useBudgetPools } from '@/hooks/useBudgetPools'
import { getToday } from '@/lib/date'
import { formatCurrency } from '@/lib/format'
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategory,
} from '@/constants/expenses'
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

const expenseSchema = z.object({
  date: z.string().min(1, '請選擇日期'),
  amount: z.number('請輸入有效金額').positive('金額需大於 0'),
  accountId: z.string().min(1, '請選擇扣款帳戶'),
  budgetPoolId: z.string().min(1, '請選擇預算池'),
  category: z.enum(EXPENSE_CATEGORIES, { message: '請選擇類別' }),
  note: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

/** 表單值 → DB payload。不含 source_type/source_id：更新不動來源關聯。 */
function toPayload(data: ExpenseFormValues): Omit<TablesInsert<'expenses'>, 'user_id'> {
  return {
    date: data.date,
    amount: data.amount,
    account_id: data.accountId,
    budget_pool_id: data.budgetPoolId,
    category: data.category,
    note: data.note || null,
  }
}

function toFormValues(
  expense: Expense | null | undefined,
  defaultCategory?: ExpenseCategory
): ExpenseFormValues {
  return {
    date: expense?.date ?? getToday(),
    amount: expense?.amount ?? (undefined as unknown as number),
    accountId: expense?.account_id ?? '',
    budgetPoolId: expense?.budget_pool_id ?? '',
    // 承諾來源的佔位類別「承諾扣款」不在正式清單，會落到 select placeholder 引導重新歸類
    category: (expense?.category as ExpenseCategory) ?? defaultCategory ?? 'food',
    note: expense?.note ?? undefined,
  }
}

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: Expense | null
  /** 建立模式的預選類別（從某類別分頁點新增時帶入） */
  defaultCategory?: ExpenseCategory
}

const numberField = {
  setValueAs: (v: unknown) => (v === '' || v === undefined ? undefined : Number(v)),
}

const CATEGORY_OPTIONS: FormSelectOption[] = EXPENSE_CATEGORIES.map((c) => ({
  value: c,
  label: EXPENSE_CATEGORY_LABELS[c],
}))

const inputClass = 'h-11 rounded-xl bg-white/5 px-4 md:text-base'
const selectClass = 'w-full rounded-xl bg-white/5 px-4 data-[size=default]:h-11 md:text-base'

export default function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  defaultCategory,
}: ExpenseFormDialogProps) {
  const navigate = useNavigate()
  const isEdit = !!expense
  // 承諾扣款產生的支出：只能重新歸類，金額/帳戶/日期/預算池鎖定
  const isCommitmentSourced = expense?.source_type === 'commitment'
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()
  const { data: accounts } = useAccounts()
  const { data: pools } = useBudgetPools()

  const accountOptions: FormSelectOption[] = (accounts ?? [])
    .filter((a) => a.is_active)
    .map((a) => ({
      value: a.id,
      label:
        a.type === 'credit_card'
          ? `${a.name}（未繳 ${formatCurrency(-a.current_balance)}）`
          : `${a.name}（餘額 ${formatCurrency(a.current_balance)}）`,
    }))

  const poolOptions: FormSelectOption[] = (pools ?? []).map((p) => ({
    value: p.id,
    label: `${POOL_TYPE_EMOJIS[p.type as PoolType]} ${p.name}`,
  }))
  const hasNoPools = poolOptions.length === 0 && !isCommitmentSourced

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
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'food' },
  })

  useEffect(() => {
    if (open) reset(toFormValues(expense, defaultCategory))
  }, [open, expense, defaultCategory, reset])

  const onSubmit = async (data: ExpenseFormValues) => {
    const payload = toPayload(data)
    try {
      if (isEdit) {
        await updateExpense.mutateAsync({ id: expense.id, ...payload })
        toast.success(isCommitmentSourced ? '類別已更新' : '支出已更新')
      } else {
        await createExpense.mutateAsync(payload)
        toast.success('支出已建立')
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
          <DialogTitle>
            {isCommitmentSourced ? '重新歸類承諾支出' : isEdit ? '編輯支出' : '新增支出'}
          </DialogTitle>
          <DialogDescription>
            {isCommitmentSourced
              ? '此支出由承諾扣款產生，僅可重新歸類為正式類別；金額與帳戶不可變更。'
              : '記錄一筆支出，扣款帳戶餘額與預算池消耗會自動反映。'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="日期" htmlFor="expense-date" error={errors.date?.message}>
              <Input
                id="expense-date"
                type="date"
                disabled={isCommitmentSourced}
                aria-invalid={errors.date ? true : undefined}
                className={inputClass}
                {...register('date')}
              />
            </FormField>
            <FormField label="金額" htmlFor="expense-amount" error={errors.amount?.message}>
              <Input
                id="expense-amount"
                type="number"
                step="any"
                min="0"
                disabled={isCommitmentSourced}
                aria-invalid={errors.amount ? true : undefined}
                className={inputClass}
                {...register('amount', numberField)}
              />
            </FormField>
          </div>

          <FormField label="扣款帳戶" error={errors.accountId?.message}>
            <FormSelect
              control={control}
              name="accountId"
              options={accountOptions}
              placeholder="選擇扣款帳戶"
              disabled={isCommitmentSourced}
              invalid={!!errors.accountId}
              className={selectClass}
            />
          </FormField>

          <FormField label="預算池" error={hasNoPools ? undefined : errors.budgetPoolId?.message}>
            {hasNoPools ? (
              <div className="rounded-xl bg-white/5 px-4 py-3">
                <p className="text-sm text-text-secondary">
                  你還沒有任何預算池，而每筆支出都必須歸屬一個預算池。
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
                disabled={isCommitmentSourced}
                invalid={!!errors.budgetPoolId}
                className={selectClass}
              />
            )}
          </FormField>

          <FormField label="類別" error={errors.category?.message}>
            <FormSelect
              control={control}
              name="category"
              options={CATEGORY_OPTIONS}
              placeholder="選擇類別"
              invalid={!!errors.category}
              className={selectClass}
            />
          </FormField>

          <FormField label="備註（選填）" htmlFor="expense-note">
            <Input
              id="expense-note"
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
              {isSubmitting
                ? '儲存中...'
                : isCommitmentSourced
                  ? '儲存類別'
                  : isEdit
                    ? '儲存變更'
                    : '建立支出'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
