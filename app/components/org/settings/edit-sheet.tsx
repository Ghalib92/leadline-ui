import { useEffect, useEffectEvent } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from 'react-hook-form';
import { missingRequired, serverFieldErrors } from '~/features/orgs';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppSheet } from '~/components/composed';
import { OrgFields } from '~/components/org/org-profile-fields';

interface EditSheetProps<TInput extends FieldValues, TOutput> {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Org field names rendered by `OrgFields`. */
  fields: readonly string[];
  required?: readonly string[];
  /** Input and parsed output may differ (e.g. `''` → `null` for numbers). */
  resolver: Resolver<TInput, unknown, TOutput>;
  values: DefaultValues<TInput>;
  onSave: (values: TOutput) => Promise<unknown>;
  pending: boolean;
  successMessage?: string;
}

/**
 * Edit one settings section in a sheet. Server validation errors land under
 * their fields; anything else is a toast.
 */
export function EditSheet<TInput extends FieldValues, TOutput>({
  open,
  onClose,
  title,
  description,
  fields,
  required,
  resolver,
  values,
  onSave,
  pending,
  successMessage = 'Saved',
}: Readonly<EditSheetProps<TInput, TOutput>>) {
  const form = useForm<TInput, unknown, TOutput>({
    resolver,
    defaultValues: values,
  });

  // Start from the current values every time the sheet opens.
  const onOpened = useEffectEvent(() => form.reset(values));
  useEffect(() => {
    if (open) onOpened();
  }, [open]);

  const submit = form.handleSubmit(async (data) => {
    // Section schemas are partial (a sheet edits a subset); enforce its `*`s.
    const missing = missingRequired(form.getValues(), required ?? []);
    if (missing.length > 0) {
      for (const name of missing) {
        form.setError(name as Path<TInput>, {
          message: 'This field is required',
        });
      }
      return;
    }
    try {
      await onSave(data);
      toastUtils.success(successMessage);
      onClose();
    } catch (error) {
      const fieldErrors = serverFieldErrors(error);
      for (const [name, message] of Object.entries(fieldErrors)) {
        form.setError(name as Path<TInput>, { message });
      }
      toastUtils.error('Could not save', extractError(error));
    }
  });

  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      dismissible={false}
      size="lg"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="org-edit-form" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form method="post" id="org-edit-form" onSubmit={submit}>
          <OrgFields names={fields} required={required} />
        </form>
      </Form>
    </AppSheet>
  );
}
