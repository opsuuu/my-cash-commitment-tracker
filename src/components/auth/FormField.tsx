import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormFieldProps extends React.ComponentProps<'input'> {
  label: string
  error?: string
}

export default function FormField({ label, error, id, ...inputProps }: FormFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId

  return (
    <div>
      <Label htmlFor={fieldId} className="mb-2 text-lavender">
        {label}
      </Label>
      <Input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        className="h-11 rounded-xl bg-white/5 px-4 md:text-base"
        {...inputProps}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
