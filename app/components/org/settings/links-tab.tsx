import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';
import { ExternalLink, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import { linkKinds } from '~/data/org-taxonomy';
import { labelOf } from '~/data/taxonomy';
import {
  serverFieldErrors,
  useLinks,
  useRemoveLink,
  useSaveLink,
} from '~/features/orgs';
import { linkFormResolver, type LinkForm, type OrgLink } from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppCard, AppSheet, useConfirm } from '~/components/composed';
import { FormPickerField, FormTextField } from '~/components/form-fields';
import type { EditingProps } from './profile-tabs';

const blank: LinkForm = { kind: 'website', url: '', label: '' };

/** Website, socials, portfolios. `?edit=link` opens "add"; `?edit=link:<id>` edits. */
export function LinksTab({ editing, setEditing }: Readonly<EditingProps>) {
  const { view } = useOrg();
  const { data: links = [], isPending } = useLinks(view.id);
  const save = useSaveLink(view.id);
  const remove = useRemoveLink(view.id);
  const { confirm, confirmDialog } = useConfirm();
  const canEdit = view.myRole === 'admin' && !view.isArchived;

  const editingId = editing?.startsWith('link:') ? editing.slice(5) : undefined;
  const open = canEdit && (editing === 'link' || !!editingId);
  const current = links.find((l) => l.id === editingId);

  const form = useForm<LinkForm>({
    resolver: linkFormResolver,
    defaultValues: blank,
  });
  const onOpened = useEffectEvent((link: OrgLink | undefined) =>
    form.reset(
      link
        ? {
            kind: link.kind as LinkForm['kind'],
            url: link.url,
            label: link.label,
          }
        : blank
    )
  );
  useEffect(() => {
    if (open) onOpened(current);
  }, [open, current]);

  const submit = form.handleSubmit(async (data) => {
    try {
      await save.mutateAsync({ ...data, id: editingId });
      toastUtils.success(editingId ? 'Link updated' : 'Link added');
      setEditing(null);
    } catch (error) {
      for (const [name, message] of Object.entries(serverFieldErrors(error))) {
        form.setError(name as keyof LinkForm, { message });
      }
      toastUtils.error('Could not save link', extractError(error));
    }
  });

  const onRemove = async (link: OrgLink) => {
    const ok = await confirm({
      title: 'Remove this link?',
      description: link.url,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(link.id);
      toastUtils.success('Link removed');
    } catch (error) {
      toastUtils.error('Could not remove link', extractError(error));
    }
  };

  return (
    <>
      <AppCard
        title="Links"
        description="Your website and profiles elsewhere — agents use them for context."
        actions={
          canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing('link')}
            >
              <Plus className="h-3.5 w-3.5" /> Add link
            </Button>
          )
        }
        contentClassName="divide-y divide-border"
      >
        {isPending ? null : links.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">No links yet.</p>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <Link2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {link.label || labelOf(linkKinds, link.kind)}
                </p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${link.url}`}
                    onClick={() => setEditing(`link:${link.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${link.url}`}
                    onClick={() => onRemove(link)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </AppCard>

      <AppSheet
        open={open}
        onOpenChange={(next) => !next && setEditing(null)}
        dismissible={false}
        title={editingId ? 'Edit link' : 'Add a link'}
        description="Your website, social profiles or portfolio."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="link-form" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save link'}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            method="post"
            id="link-form"
            onSubmit={submit}
            className="space-y-4"
          >
            <FormPickerField
              control={form.control}
              name="kind"
              placeholder="What kind of link?"
              label="Kind"
              options={linkKinds}
              searchable={false}
              clearable={false}
            />
            <FormTextField
              control={form.control}
              name="url"
              autoComplete="url"
              label="URL"
              type="url"
              placeholder="https://"
              required
            />
            <FormTextField
              control={form.control}
              name="label"
              autoComplete="off"
              label="Label"
              placeholder="Optional, e.g. Impact report 2025"
            />
          </form>
        </Form>
      </AppSheet>
      {confirmDialog}
    </>
  );
}
