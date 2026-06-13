import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  useBudgetPools,
  useCreateBudgetPool,
  useUpdateBudgetPool,
  type BudgetPool,
} from '@/hooks/useBudgetPools'
import { useAccounts } from '@/hooks/useAccounts'
import type { TablesInsert } from '@/types/database.types'
import {
  POOL_TYPES,
  POOL_TYPE_LABELS,
  ROLLOVER_MODES,
  ROLLOVER_MODE_LABELS,
  ROLLOVER_MODE_HINTS,
  POOL_MODES,
  POOL_MODE_LABELS,
  type PoolType,
  type RolloverMode,
  type PoolMode,
} from '@/constants/budgetPools'
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

const poolSchema = z
  .object({
    name: z.string().min(1, '請輸入預算池名稱'),
    type: z.enum(POOL_TYPES),
    monthlyBudget: z.number('請輸入有效金額').positive('月預算需大於 0').optional(),
    rolloverMode: z.enum(ROLLOVER_MODES),
    sweepToPoolId: z.string().optional(),
    targetAmount: z.number('請輸入有效金額').positive('目標金額需大於 0').optional(),
    targetDate: z.string().optional(),
    poolMode: z.enum(POOL_MODES),
    linkedAccountId: z.string().optional(),
    currentAmount: z.number('請輸入有效金額').min(0, '金額不可為負數').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'spending') {
      if (data.monthlyBudget === undefined) {
        ctx.addIssue({ code: 'custom', path: ['monthlyBudget'], message: '請輸入月預算上限' })
      }
      if (data.rolloverMode === 'auto_sweep' && !data.sweepToPoolId) {
        ctx.addIssue({ code: 'custom', path: ['sweepToPoolId'], message: '請選擇轉入的儲蓄池' })
      }
    }
    if (data.type === 'saving') {
      if (data.targetAmount === undefined) {
        ctx.addIssue({ code: 'custom', path: ['targetAmount'], message: '請輸入目標金額' })
      }
      if (data.poolMode === 'account-backed' && !data.linkedAccountId) {
        ctx.addIssue({ code: 'custom', path: ['linkedAccountId'], message: '請選擇綁定的帳戶' })
      }
    }
  })

type PoolFormValues = z.infer<typeof poolSchema>

/**
 * 表單值 → 資料庫 payload。依類型把不相關欄位歸零成 null（支出池清掉儲蓄欄位，反之亦然），
 * 集中型別轉換的責任；回傳型別對齊 budget_pools schema。
 */
function toPoolPayload(data: PoolFormValues): Omit<TablesInsert<'budget_pools'>, 'user_id'> {
  const isSpending = data.type === 'spending'
  return {
    name: data.name,
    type: data.type,
    monthly_budget: isSpending ? data.monthlyBudget : null,
    rollover_mode: isSpending ? data.rolloverMode : 'reset',
    sweep_to_pool_id: isSpending && data.rolloverMode === 'auto_sweep' ? data.sweepToPoolId : null,
    target_amount: isSpending ? null : data.targetAmount,
    target_date: isSpending ? null : data.targetDate || null,
    pool_mode: isSpending ? 'virtual' : data.poolMode,
    linked_account_id:
      !isSpending && data.poolMode === 'account-backed' ? data.linkedAccountId : null,
    current_amount: !isSpending && data.poolMode === 'virtual' ? (data.currentAmount ?? 0) : null,
  }
}

/**
 * 資料庫 row → 表單初始值（toPoolPayload 的反向）。新建時 pool 為 null，
 * 帶入預設值與 defaultType（從空狀態的分類 CTA 進來時的預選類型）。
 */
function toFormValues(pool: BudgetPool | null | undefined, defaultType?: PoolType): PoolFormValues {
  return {
    name: pool?.name ?? '',
    type: (pool?.type as PoolType) ?? defaultType ?? 'spending',
    monthlyBudget: pool?.monthly_budget ?? undefined,
    rolloverMode: (pool?.rollover_mode as RolloverMode) ?? 'reset',
    sweepToPoolId: pool?.sweep_to_pool_id ?? undefined,
    targetAmount: pool?.target_amount ?? undefined,
    targetDate: pool?.target_date ?? undefined,
    poolMode: (pool?.pool_mode as PoolMode) ?? 'virtual',
    linkedAccountId: pool?.linked_account_id ?? undefined,
    currentAmount: pool?.current_amount ?? 0,
  }
}

interface BudgetPoolFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 有值代表編輯模式；類型建立後鎖定不可改 */
  pool?: BudgetPool | null
  /** 建立模式的預選類型（從空狀態的分類 CTA 進來時用） */
  defaultType?: PoolType
}

const numberField = {
  setValueAs: (v: unknown) => (v === '' || v === undefined ? undefined : Number(v)),
}

// 枚舉型 select 的選項（靜態，模組層算一次即可）；帳戶/儲蓄池等動態選項在元件內即時組
const TYPE_OPTIONS: FormSelectOption[] = POOL_TYPES.map((t) => ({
  value: t,
  label: POOL_TYPE_LABELS[t],
}))
const ROLLOVER_OPTIONS: FormSelectOption[] = ROLLOVER_MODES.map((m) => ({
  value: m,
  label: ROLLOVER_MODE_LABELS[m],
}))
const POOL_MODE_OPTIONS: FormSelectOption[] = POOL_MODES.map((m) => ({
  value: m,
  label: POOL_MODE_LABELS[m],
}))

const inputClass = 'h-11 rounded-xl bg-white/5 px-4 md:text-base'
const selectClass = 'w-full rounded-xl bg-white/5 px-4 data-[size=default]:h-11 md:text-base'

export default function BudgetPoolFormDialog({
  open,
  onOpenChange,
  pool,
  defaultType,
}: BudgetPoolFormDialogProps) {
  const isEdit = !!pool
  const createPool = useCreateBudgetPool()
  const updatePool = useUpdateBudgetPool()
  const { data: pools } = useBudgetPools()
  const { data: accounts } = useAccounts()

  const savingPools = (pools ?? []).filter((p) => p.type === 'saving' && p.id !== pool?.id)
  const activeAccounts = (accounts ?? []).filter((a) => a.is_active)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PoolFormValues>({
    resolver: zodResolver(poolSchema),
    defaultValues: { name: '', type: 'spending', rolloverMode: 'reset', poolMode: 'virtual' },
  })

  const selectedType = useWatch({ control, name: 'type' })
  const selectedRollover = useWatch({ control, name: 'rolloverMode' })
  const selectedPoolMode = useWatch({ control, name: 'poolMode' })

  useEffect(() => {
    if (open) {
      reset(toFormValues(pool, defaultType))
    }
  }, [open, pool, defaultType, reset])

  const onSubmit = async (data: PoolFormValues) => {
    const payload = toPoolPayload(data)

    try {
      if (isEdit) {
        await updatePool.mutateAsync({ id: pool.id, ...payload })
        toast.success('預算池已更新')
      } else {
        await createPool.mutateAsync(payload)
        toast.success('預算池已建立')
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
          <DialogTitle>{isEdit ? '編輯預算池' : '新增預算池'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '修改預算池設定（類型建立後不可變更）'
              : '支出池管理每月花費，儲蓄池累積目標金額'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="名稱" htmlFor="pool-name" error={errors.name?.message}>
            <Input
              id="pool-name"
              placeholder="例如：日常開銷、日本旅遊基金"
              aria-invalid={errors.name ? true : undefined}
              className={inputClass}
              {...register('name')}
            />
          </FormField>

          <FormField label="類型">
            <FormSelect
              control={control}
              name="type"
              options={TYPE_OPTIONS}
              disabled={isEdit}
              className={selectClass}
            />
          </FormField>

          {selectedType === 'spending' && (
            <>
              <FormField
                label="月預算上限"
                htmlFor="pool-budget"
                error={errors.monthlyBudget?.message}
              >
                <Input
                  id="pool-budget"
                  type="number"
                  step="any"
                  min="0"
                  aria-invalid={errors.monthlyBudget ? true : undefined}
                  className={inputClass}
                  {...register('monthlyBudget', numberField)}
                />
              </FormField>

              <FormField label="月底結算規則">
                <FormSelect
                  control={control}
                  name="rolloverMode"
                  options={ROLLOVER_OPTIONS}
                  className={selectClass}
                />
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {ROLLOVER_MODE_HINTS[selectedRollover]}
                </p>
              </FormField>

              {selectedRollover === 'auto_sweep' && (
                <FormField label="轉入的儲蓄池" error={errors.sweepToPoolId?.message}>
                  <FormSelect
                    control={control}
                    name="sweepToPoolId"
                    options={savingPools.map((p) => ({ value: p.id, label: p.name }))}
                    placeholder="選擇儲蓄池"
                    invalid={!!errors.sweepToPoolId}
                    className={selectClass}
                  />
                  <p className="mt-1 text-xs leading-relaxed text-text-muted">
                    月底結餘只能轉入儲蓄池，不會流回支出池本身。
                  </p>
                  {savingPools.length === 0 && (
                    <p className="mt-1 text-xs text-warning">
                      還沒有儲蓄池，請先建立一個儲蓄池才能使用此規則。
                    </p>
                  )}
                </FormField>
              )}
            </>
          )}

          {selectedType === 'saving' && (
            <>
              <FormField
                label="目標金額"
                htmlFor="pool-target"
                error={errors.targetAmount?.message}
              >
                <Input
                  id="pool-target"
                  type="number"
                  step="any"
                  min="0"
                  aria-invalid={errors.targetAmount ? true : undefined}
                  className={inputClass}
                  {...register('targetAmount', numberField)}
                />
              </FormField>

              <FormField label="目標日期（選填）" htmlFor="pool-target-date">
                <Input
                  id="pool-target-date"
                  type="date"
                  className={inputClass}
                  {...register('targetDate')}
                />
              </FormField>

              <FormField label="資金模式">
                <FormSelect
                  control={control}
                  name="poolMode"
                  options={POOL_MODE_OPTIONS}
                  className={selectClass}
                />
                <p className="mt-1 text-xs text-text-muted">
                  虛擬記錄：手動記錄累積金額；綁定帳戶：直接以帳戶餘額計算進度
                </p>
              </FormField>

              {selectedPoolMode === 'account-backed' ? (
                <FormField label="綁定帳戶" error={errors.linkedAccountId?.message}>
                  <FormSelect
                    control={control}
                    name="linkedAccountId"
                    options={activeAccounts.map((a) => ({ value: a.id, label: a.name }))}
                    placeholder="選擇帳戶"
                    invalid={!!errors.linkedAccountId}
                    className={selectClass}
                  />
                </FormField>
              ) : (
                <FormField
                  label="目前已存金額"
                  htmlFor="pool-current"
                  error={errors.currentAmount?.message}
                >
                  <Input
                    id="pool-current"
                    type="number"
                    step="any"
                    min="0"
                    aria-invalid={errors.currentAmount ? true : undefined}
                    className={inputClass}
                    {...register('currentAmount', numberField)}
                  />
                </FormField>
              )}
            </>
          )}

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
              {isSubmitting ? '儲存中...' : isEdit ? '儲存變更' : '建立預算池'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
