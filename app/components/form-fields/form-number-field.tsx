import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';

interface FormNumberFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  /** HTML autocomplete token; `off` for figures that shouldn't autofill. */
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function FormNumberField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  autoComplete,
  required = false,
  disabled = false,
  min,
  max,
  step,
}: Readonly<FormNumberFieldProps<TFieldValues>>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-destructive">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              min={min}
              max={max}
              step={step}
              {...field}
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value === '' ? '' : Number(value));
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
