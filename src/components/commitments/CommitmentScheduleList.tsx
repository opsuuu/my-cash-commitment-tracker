import { useCommitmentSchedules, type CommitmentSchedule } from '@/hooks/useCommitments'
import { formatCurrency } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import CommitmentStatusBadge from './CommitmentStatusBadge'

interface CommitmentScheduleListProps {
  commitmentId: string
  onChargeSchedule: (schedule: CommitmentSchedule) => void
}

export default function CommitmentScheduleList({
  commitmentId,
  onChargeSchedule,
}: CommitmentScheduleListProps) {
  const { data: schedules, isPending } = useCommitmentSchedules(commitmentId)

  if (isPending) {
    return (
      <div className="mt-3 flex justify-center border-t border-border pt-3">
        <Spinner className="size-5 text-primary" />
      </div>
    )
  }

  return (
    <ul className="mt-3 space-y-3 border-t border-border pt-3">
      {(schedules ?? []).map((schedule, index) => (
        <li
          key={schedule.id}
          className="space-y-1 border-b border-border/50 pb-3 text-sm last:border-0 last:pb-0"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-text-secondary">第 {index + 1} 期</span>
              <span className="truncate text-xs text-text-muted">{schedule.due_date}</span>
            </div>
            <span className="shrink-0 tabular-nums text-floral-white">
              {formatCurrency(schedule.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <CommitmentStatusBadge status={schedule.status} />
            {schedule.status === 'pending' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onChargeSchedule(schedule)}
                className="shrink-0 rounded-lg"
              >
                標記已扣款
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
