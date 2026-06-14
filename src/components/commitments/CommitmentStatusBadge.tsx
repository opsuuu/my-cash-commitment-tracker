import {
  COMMITMENT_STATUS_BADGE,
  COMMITMENT_STATUS_LABELS,
  type CommitmentStatus,
} from '@/constants/commitments'
import { cn } from '@/lib/utils'

interface CommitmentStatusBadgeProps {
  status: string
}

export default function CommitmentStatusBadge({ status }: CommitmentStatusBadgeProps) {
  const key = status as CommitmentStatus
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap mt-0.5',
        COMMITMENT_STATUS_BADGE[key] ?? 'bg-white/10 text-text-muted'
      )}
    >
      {COMMITMENT_STATUS_LABELS[key] ?? status}
    </span>
  )
}
