import { Separator } from '@/components/ui/separator'

interface TextDividerProps {
  label?: string
}

export default function TextDivider({ label = '或' }: TextDividerProps) {
  return (
    <div className="my-6 flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-sm text-text-secondary">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}
