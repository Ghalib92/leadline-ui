import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { deleteAccountResolver, type DeleteAccountInput } from '~/lib/schema';
import { applyFieldErrors, useDeleteAccount } from '~/features/auth';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppCard, AppSheet } from '~/components/composed';
import { FormPasswordField } from '~/components/form-fields';

/**
 * Delete the account for good, after the password once more. `description`
 * says what goes with it (a job seeker's CV and job search, or the
 * workspaces only this person uses).
 */
export function DeleteAccountCard({
  description,
}: Readonly<{ description: string }>) {
  const [open, setOpen] = useState(false);
  const remove = useDeleteAccount();
  const form = useForm<DeleteAccountInput>({
    resolver: deleteAccountResolver,
    defaultValues: { password: '' },
  });

  const submit = form.handleSubmit(async (data) => {
    try {
      await remove.mutateAsync(data);
      toastUtils.success('Your account was deleted', 'Sorry to see you go.');
    } catch (error) {
      applyFieldErrors(error, form.setError);
      toastUtils.error('Could not delete your account', extractError(error));
    }
  });

  return (
    <AppCard title="Delete account" className="border-destructive/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Button
          variant="destructive"
          className="shrink-0"
          onClick={() => {
            form.reset({ password: '' });
            setOpen(true);
          }}
        >
          Delete account
        </Button>
      </div>

      <AppSheet
        open={open}
        onOpenChange={setOpen}
        dismissible={false}
        title="Delete your account?"
        description={`${description} This can’t be undone.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="delete-account-form"
              variant="destructive"
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Deleting…' : 'Delete for good'}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            method="post"
            id="delete-account-form"
            onSubmit={submit}
            className="space-y-4"
          >
            <FormPasswordField
              control={form.control}
              name="password"
              autoComplete="current-password"
              label="Your password"
              required
            />
          </form>
        </Form>
      </AppSheet>
    </AppCard>
  );
}
