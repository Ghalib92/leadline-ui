import {
  useFieldArray,
  useFormState,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { FormTextareaField, FormTextField } from '~/components/form-fields';

const MAX_SERVICES = 20;

/** "What you sell": one row per service (name, rough price, short description).
 * Used by onboarding and the clients brief, on a form with a `services` list. */
export function ServicesField({
  control,
  required = false,
}: Readonly<{ control: Control<FieldValues>; required?: boolean }>) {
  const services = useFieldArray({ control, name: 'services' });
  const { errors } = useFormState({ control, name: 'services' });
  // A list-level error (e.g. none added yet) sits on `services.root` or `services`.
  const listError =
    (errors.services as { root?: { message?: string }; message?: string })?.root
      ?.message ??
    (errors.services as { message?: string } | undefined)?.message;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">
          What you sell{' '}
          {required && <span className="text-destructive">*</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          Each service the AI should find customers for, e.g. websites, AI
          chatbots, mobile apps.
        </p>
      </div>
      {services.fields.map((field, index) => (
        <div
          key={field.id}
          className="space-y-3 rounded-lg border border-border p-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormTextField
              control={control}
              name={`services.${index}.name`}
              label="Service"
              placeholder="Business websites"
              autoComplete="off"
              required
            />
            <FormTextField
              control={control}
              name={`services.${index}.price`}
              label="Rough price"
              placeholder="From KES 40,000"
              autoComplete="off"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormTextareaField
                control={control}
                name={`services.${index}.description`}
                label="What it includes"
                placeholder="5-page site, mobile-friendly, WhatsApp button, 3 weeks"
                rows={2}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove service ${index + 1}`}
              onClick={() => services.remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {services.fields.length < MAX_SERVICES && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            services.append({ name: '', price: '', description: '' })
          }
        >
          <Plus className="h-4 w-4" /> Add a service
        </Button>
      )}
      {listError && (
        <p className="text-sm font-medium text-destructive">{listError}</p>
      )}
    </div>
  );
}
