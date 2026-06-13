import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  /** 控制項本體（Input / FormSelect…），以及可選的 hint（放在 children 尾端，會排在 error 之前） */
  children: ReactNode
}

export default function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-2 text-lavender">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
