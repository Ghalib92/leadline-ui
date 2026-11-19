import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';
import {
  serverFieldErrors,
  useCreateFolder,
  useUpdateFolder,
} from '~/features/orgs';
import {
  folderFormResolver,
  type FolderForm,
  type KnowledgeFolder,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppSheet } from '~/components/composed';
import { FormTextareaField, FormTextField } from '~/components/form-fields';

/** Create a folder, or rename / re-describe one (`folder` given). */
export function FolderSheet({
  folder,
  open,
  onClose,
}: Readonly<{
  folder?: KnowledgeFolder;
  open: boolean;
  onClose: () => void;
}>) {
  const { view } = useOrg();
  const create = useCreateFolder(view.id);
  const update = useUpdateFolder(view.id);
  const form = useForm<FolderForm>({
    resolver: folderFormResolver,
    defaultValues: { name: '', purpose: '' },
  });

  const onOpened = useEffectEvent(() =>
    form.reset({ name: folder?.name ?? '', purpose: folder?.purpose ?? '' })
  );
  useEffect(() => {
    if (open) onOpened();
  }, [open]);

  const submit = form.handleSubmit(async (data) => {
    try {
      if (folder) await update.mutateAsync({ id: folder.id, ...data });
      else await create.mutateAsync(data);
      toastUtils.success(folder ? 'Folder updated' : 'Folder created');
      onClose();
    } catch (error) {
      for (const [name, message] of Object.entries(serverFieldErrors(error))) {
        form.setError(name as keyof FolderForm, { message });
      }
      toastUtils.error('Could not save the folder', extractError(error));
    }
  });
  const busy = create.isPending || update.isPending;

  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      dismissible={false}
      title={folder ? 'Edit folder' : 'New folder'}
      description="Leadline reads a folder's purpose to know what its files show."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="folder-form" disabled={busy}>
            {folder ? 'Save changes' : 'Create folder'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          method="post"
          id="folder-form"
          onSubmit={submit}
          className="space-y-4"
        >
          <FormTextField
            control={form.control}
            name="name"
            label="Name"
            required
            autoComplete="off"
            placeholder="e.g. Past proposals"
          />
          <FormTextareaField
            control={form.control}
            name="purpose"
            label="Purpose"
            autoComplete="off"
            rows={3}
            placeholder="What these files prove, e.g. delivery experience in health projects"
          />
        </form>
      </Form>
    </AppSheet>
  );
}
