import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface FormSelectOption {
  value: string
  label: string
}

interface FormSelectProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>
  name: TName
  options: FormSelectOption[]
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
}

export default function FormSelect<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  options,
  placeholder,
  disabled,
  invalid,
  className,
}: FormSelectProps<TFieldValues, TName>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={disabled}>
          <SelectTrigger className={className} aria-invalid={invalid ? true : undefined}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )
}
