import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, PencilIcon, Trash2Icon, CheckIcon } from 'lucide-react'
import {
  useInstallmentProgress,
  type Commitment,
  type CommitmentSchedule,
} from '@/hooks/useCommitments'
import { useBudgetPools } from '@/hooks/useBudgetPools'
import { formatCurrency } from '@/lib/format'
import {
  COMMITMENT_TYPE_EMOJIS,
  COMMITMENT_PRIORITY_LABELS,
  COMMITMENT_PRIORITY_BADGE,
  type CommitmentType,
  type CommitmentPriority,
} from '@/constants/commitments'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import CommitmentStatusBadge from './CommitmentStatusBadge'
import CommitmentScheduleList from './CommitmentScheduleList'
import CommitmentFormDialog from './CommitmentFormDialog'
import CancelCommitmentDialog from './CancelCommitmentDialog'
import ChargeDialog from './ChargeDialog'

interface CommitmentCardProps {
  commitment: Commitment
}

export default function CommitmentCard({ commitment }: CommitmentCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [chargingSchedule, setChargingSchedule] = useState<CommitmentSchedule | null>(null)
  const [expanded, setExpanded] = useState(false)

  const { data: pools } = useBudgetPools()
  const { data: progressMap } = useInstallmentProgress()

  const pool = pools?.find((p) => p.id === commitment.budget_pool_id)
  const isInstallment = commitment.type === 'installment'
  const isActiveState = commitment.status === 'pending' || commitment.status === 'active'

  const canEdit = isInstallment ? isActiveState : commitment.status === 'pending'
  const canChargeOneTime = !isInstallment && commitment.status === 'pending'
  const canCancel = isActiveState

  const progress = progressMap?.[commitment.id]
  const remaining = progress?.pending ?? commitment.installment_count ?? 0
  const total = commitment.installment_count ?? progress?.total ?? 0

  return (
    <Card className="rounded-3xl backdrop-blur-md [--card-spacing:--spacing(5)]">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-floral-white">
              <span aria-hidden="true">
                {COMMITMENT_TYPE_EMOJIS[commitment.type as CommitmentType]}
              </span>
              <span className="truncate">{commitment.title}</span>
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-2">
              <CommitmentStatusBadge status={commitment.status} />
              <span className="text-xs text-text-muted">
                {pool?.name ?? '未知預算池'}
                {isInstallment && total > 0 && ` ・剩餘 ${remaining}/${total} 期`}
                {!isInstallment && commitment.expected_charge_date && (
                  <> ・預計 {commitment.expected_charge_date} 扣款</>
                )}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-semibold tabular-nums text-floral-white">
              {formatCurrency(commitment.amount)}
            </p>
            <span
              className={cn(
                'mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                COMMITMENT_PRIORITY_BADGE[commitment.priority as CommitmentPriority]
              )}
            >
              {COMMITMENT_PRIORITY_LABELS[commitment.priority as CommitmentPriority]}優先
            </span>
          </div>
        </div>

        {commitment.note && <p className="text-xs text-text-secondary">{commitment.note}</p>}

        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="rounded-lg"
            >
              <PencilIcon />
              編輯
            </Button>
          )}
          {canChargeOneTime && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setChargeOpen(true)}
              className="rounded-lg"
            >
              <CheckIcon />
              標記已扣款
            </Button>
          )}
          {isInstallment && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg"
            >
              {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              {expanded ? '收合期程' : '展開期程'}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="ml-auto rounded-lg text-text-muted"
            >
              <Trash2Icon />
              取消
            </Button>
          )}
        </div>

        {isInstallment && expanded && (
          <CommitmentScheduleList
            commitmentId={commitment.id}
            onChargeSchedule={setChargingSchedule}
          />
        )}
      </CardContent>

      <CommitmentFormDialog open={editOpen} onOpenChange={setEditOpen} commitment={commitment} />
      <CancelCommitmentDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        commitment={commitment}
      />
      <ChargeDialog open={chargeOpen} onOpenChange={setChargeOpen} commitment={commitment} />
      <ChargeDialog
        open={!!chargingSchedule}
        onOpenChange={(open) => !open && setChargingSchedule(null)}
        commitment={commitment}
        schedule={chargingSchedule}
      />
    </Card>
  )
}
