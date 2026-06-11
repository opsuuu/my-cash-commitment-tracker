import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCreateAccount, useUpdateAccount, type Account } from '@/hooks/useAccounts'
import { ACCOUNT_TYPES, ACCOUNT_TYPE_LABELS, type AccountType } from '@/constants/accounts'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const accountSchema = z
  // 信用卡的「未繳金額」在 UI 一律以正數輸入，存檔時才轉為負數（資料層以負數代表欠款）
  .object({
    name: z.string().min(1, '請輸入帳戶名稱'),
    type: z.enum(ACCOUNT_TYPES),
    balance: z.number('請輸入有效金額').min(0, '金額不可為負數'),
    creditLimit: z.number('請輸入有效額度').positive('額度需大於 0').optional(),
  })

interface AccountFormValues {
  name: string
  type: AccountType
  balance: number
  creditLimit?: number
}

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 有值代表編輯模式；編輯時餘額不可改（需走「調整餘額」） */
  account?: Account | null
}

export default function AccountFormDialog({ open, onOpenChange, account }: AccountFormDialogProps) {
  const isEdit = !!account
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: '', type: 'bank', balance: 0 },
  })

  const selectedType = watch('type')

  useEffect(() => {
    if (open) {
      reset({
        name: account?.name ?? '',
        type: (account?.type as AccountType) ?? 'bank',
        // 編輯模式餘額欄位不顯示，僅佔位；信用卡取絕對值避免負數卡住驗證
        balance: account ? Math.abs(account.balance) : 0,
        creditLimit: account?.credit_limit ?? undefined,
      })
    }
  }, [open, account, reset])

  const onSubmit = async (data: AccountFormValues) => {
    // 信用卡尚有未繳金額時不可變更類型（負數餘額對其他類型無意義）
    if (
      isEdit &&
      account.type === 'credit_card' &&
      data.type !== 'credit_card' &&
      account.balance < 0
    ) {
      toast.error('此信用卡尚有未繳金額，請先將未繳金額調整為 0 再變更類型')
      return
    }
    try {
      if (isEdit) {
        await updateAccount.mutateAsync({
          id: account.id,
          name: data.name,
          type: data.type,
          credit_limit: data.type === 'credit_card' ? (data.creditLimit ?? null) : null,
        })
        toast.success('帳戶已更新')
      } else {
        await createAccount.mutateAsync({
          name: data.name,
          type: data.type,
          // 信用卡輸入的是未繳金額（正數），資料層以負數代表欠款
          balance: data.type === 'credit_card' ? -data.balance : data.balance,
          credit_limit: data.type === 'credit_card' ? (data.creditLimit ?? null) : null,
        })
        toast.success('帳戶已建立')
      }
      onOpenChange(false)
    } catch {
      toast.error(isEdit ? '更新失敗，請稍後再試' : '建立失敗，請稍後再試')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '編輯帳戶' : '新增帳戶'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改帳戶名稱、類型或信用額度' : '建立一個資金帳戶來追蹤你的錢錢'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="account-name" className="mb-2 text-lavender">
              帳戶名稱
            </Label>
            <Input
              id="account-name"
              placeholder="例如：台新銀行、皮夾現金"
              aria-invalid={errors.name ? true : undefined}
              className="h-11 rounded-xl bg-white/5 px-4 md:text-base"
              {...register('name')}
            />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div>
            <Label className="mb-2 text-lavender">帳戶類型</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full rounded-xl bg-white/5 px-4 data-[size=default]:h-11 md:text-base">
                    <SelectValue placeholder="選擇類型" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {ACCOUNT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {!isEdit && (
            <div>
              <Label htmlFor="account-balance" className="mb-2 text-lavender">
                {selectedType === 'credit_card' ? '目前未繳金額' : '初始餘額'}
              </Label>
              <Input
                id="account-balance"
                type="number"
                step="any"
                min="0"
                aria-invalid={errors.balance ? true : undefined}
                className="h-11 rounded-xl bg-white/5 px-4 md:text-base"
                {...register('balance', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
              />
              {selectedType === 'credit_card' && (
                <p className="mt-1 text-xs text-text-muted">
                  填「總欠款」＝已出帳未繳＋未出帳金額。快速算法：信用額度 − 銀行 app 顯示的可用餘額
                </p>
              )}
              {errors.balance && (
                <p className="mt-1 text-xs text-danger">{errors.balance.message}</p>
              )}
            </div>
          )}

          {selectedType === 'credit_card' && (
            <div>
              <Label htmlFor="account-credit-limit" className="mb-2 text-lavender">
                信用額度（選填）
              </Label>
              <Input
                id="account-credit-limit"
                type="number"
                step="any"
                placeholder="用於計算額度使用率"
                aria-invalid={errors.creditLimit ? true : undefined}
                className="h-11 rounded-xl bg-white/5 px-4 md:text-base"
                {...register('creditLimit', {
                  setValueAs: (v) => (v === '' ? undefined : Number(v)),
                })}
              />
              {errors.creditLimit && (
                <p className="mt-1 text-xs text-danger">{errors.creditLimit.message}</p>
              )}
            </div>
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
              {isSubmitting ? '儲存中...' : isEdit ? '儲存變更' : '建立帳戶'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
