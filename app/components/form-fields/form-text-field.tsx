import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';

interface FormTextFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  /** Help under the field. */
  description?: string;
  placeholder?: string;
  /** HTML autocomplete token (`email`, `new-password`, `organization`…): autofill + a11y. */
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  type?:
    | 'text'
    | 'email'
    | 'url'
    | 'date'
    | 'number'
    | 'time'
    | 'datetime-local';
}

export function FormTextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  autoComplete,
  required = false,
  disabled = false,
  type = 'text',
}: Readonly<FormTextFieldProps<TFieldValues>>) {
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
              // A link is a text field with the URL keyboard: the browser's own URL
              // check refuses "linkedin.com/in/…", which the schema completes itself.
              type={type === 'url' ? 'text' : type}
              inputMode={type === 'url' ? 'url' : undefined}
              placeholder={placeholder}
              autoComplete={autoComplete}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
