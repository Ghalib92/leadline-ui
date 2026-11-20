import { useEffect, useEffectEvent } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { ExternalLink, Globe, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  serverFieldErrors,
  useRemoveSource,
  useSaveSource,
  useSources,
  useToggleSource,
} from '~/features/orgs';
import {
  orgSourceFormResolver,
  orgSourcesFormResolver,
  type OrgSource,
  type OrgSourceForm,
  type OrgSourcesForm,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { Switch } from '~/components/ui/switch';
import { AppCard, AppSheet, useConfirm } from '~/components/composed';
import {
  FormSwitchField,
  FormTextareaField,
  FormTextField,
} from '~/components/form-fields';
import type { EditingProps } from './profile-tabs';

const blank: OrgSourceForm = {
  url: '',
  label: '',
  notes: '',
  enabled: true,
};

/** What a source is, in each kind of account's words. */
const COPY = {
  organization: {
    title: 'Your sources',
    description:
      'Tender portals, grant databases and pages that list opportunities. Leadline reads them on every search, on top of the places it already checks.',
    empty:
      'None yet. Add a tender portal, a grants page or a list of calls that Leadline should read.',
    add: 'Add source',
    addTitle: 'Add sources',
    addDescription:
      'Tender portals, grant pages or lists of calls for Leadline to read. Add as many as you like.',
    editTitle: 'Edit source',
    editDescription:
      'A tender portal, grants page or list of calls for Leadline to read.',
    url: 'https://example.org/funding-calls',
    label: 'Optional, e.g. County tenders',
    notes: 'Optional, e.g. Only ICT and construction tenders',
  },
  candidate: {
    title: 'Job sites to watch',
    description:
      'Career pages and job sites you want Leadline to check on every search, like the careers page of a company you’d love to work for. Leadline also checks the job boards it knows.',
    empty:
      'None yet. Add the careers page of a company you want to work for, e.g. Safaricom or Airtel careers.',
    add: 'Add a job site',
    addTitle: 'Add job sites',
    addDescription:
      'Career pages and job sites for Leadline to check. Add as many as you like.',
    editTitle: 'Edit job site',
    editDescription: 'A careers page or job site for Leadline to check.',
    url: 'https://www.safaricom.co.ke/careers',
    label: 'Optional, e.g. Safaricom careers',
    notes: 'Optional, e.g. Only engineering jobs',
  },
};
type Copy = (typeof COPY)['organization'];

function formatDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

/**
 * Pages Leadline reads on every search: tender portals and grant databases for
 * an organization, career pages and job sites for a job seeker.
 * `?edit=source` opens "add"; `?edit=source:<id>` edits.
 */
export function SourcesTab({ editing, setEditing }: Readonly<EditingProps>) {
  const { view } = useOrg();
  const copy = view.isCandidate ? COPY.candidate : COPY.organization;
  const { data: sources = [], isPending } = useSources(view.id);
  const save = useSaveSource(view.id);
  const remove = useRemoveSource(view.id);
  const toggle = useToggleSource(view.id);
  const { confirm, confirmDialog } = useConfirm();
  const canEdit = view.myRole === 'admin' && !view.isArchived;

  const editingId = editing?.startsWith('source:')
    ? editing.slice(7)
    : undefined;
  const open = canEdit && !!editingId;
  const adding = canEdit && editing === 'source';
  const current = sources.find((s) => s.id === editingId);

  const form = useForm<OrgSourceForm>({
    resolver: orgSourceFormResolver,
    defaultValues: blank,
  });

  const onOpened = useEffectEvent((source: OrgSource | undefined) =>
    form.reset(
      source
        ? {
            url: source.url,
            label: source.label,
            notes: source.notes,
            enabled: source.enabled,
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
      toastUtils.success('Source updated');
      setEditing(null);
    } catch (error) {
      for (const [name, message] of Object.entries(serverFieldErrors(error))) {
        form.setError(name as keyof OrgSourceForm, { message });
      }
      toastUtils.error('Could not save source', extractError(error));
    }
  });

  const onToggle = async (source: OrgSource, enabled: boolean) => {
    try {
      await toggle.mutateAsync({ id: source.id, enabled });
      toastUtils.success(enabled ? 'Source activated' : 'Source paused');
    } catch (error) {
      toastUtils.error('Could not update source', extractError(error));
    }
  };

  const onRemove = async (source: OrgSource) => {
    const ok = await confirm({
      title: 'Remove this source?',
      description: source.label
        ? `${source.label} (${source.url})`
        : source.url,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(source.id);
      toastUtils.success('Source removed');
    } catch (error) {
      toastUtils.error('Could not remove source', extractError(error));
    }
  };

  return (
    <>
      <AppCard
        title={copy.title}
        description={copy.description}
        actions={
          canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing('source')}
            >
              <Plus className="h-3.5 w-3.5" /> {copy.add}
            </Button>
          )
        }
        contentClassName="divide-y divide-border"
      >
        {isPending ? null : sources.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Globe className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">
                    {source.label || formatDomain(source.url)}
                  </p>
                  <Badge
                    variant={source.enabled ? 'secondary' : 'outline'}
                    className="text-xs font-normal"
                  >
                    {source.enabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
                >
                  <span className="truncate">{source.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
                {source.notes && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {source.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <>
                    <Switch
                      size="sm"
                      checked={source.enabled}
                      disabled={toggle.isPending}
                      onCheckedChange={(checked) => onToggle(source, checked)}
                      aria-label={
                        source.enabled ? 'Pause source' : 'Activate source'
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${source.url}`}
                      onClick={() => setEditing(`source:${source.id}`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${source.url}`}
                      onClick={() => onRemove(source)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </AppCard>

      <AppSheet
        open={open}
        onOpenChange={(next) => !next && setEditing(null)}
        dismissible={false}
        title={copy.editTitle}
        description={copy.editDescription}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="submit" form="source-form" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            method="post"
            id="source-form"
            onSubmit={submit}
            className="space-y-4"
          >
            <FormTextField
              control={form.control}
              name="url"
              autoComplete="url"
              label="Link"
              type="url"
              placeholder={copy.url}
              required
            />
            <FormTextField
              control={form.control}
              name="label"
              autoComplete="off"
              label="Label"
              placeholder={copy.label}
            />
            <FormTextareaField
              control={form.control}
              name="notes"
              autoComplete="off"
              label="Notes"
              placeholder={copy.notes}
              rows={3}
            />
            <FormSwitchField
              control={form.control}
              name="enabled"
              label="Active"
              description="Read this source in every search."
            />
          </form>
        </Form>
      </AppSheet>
      <AddSourcesSheet
        open={adding}
        orgId={view.id}
        copy={copy}
        onClose={() => setEditing(null)}
      />
      {confirmDialog}
    </>
  );
}

/** Add several sources in one go: a row each, then one save. Rows that fail stay
 * with their error; the ones that saved leave the list. */
function AddSourcesSheet({
  open,
  orgId,
  copy,
  onClose,
}: Readonly<{
  open: boolean;
  orgId: string;
  copy: Copy;
  onClose: () => void;
}>) {
  const save = useSaveSource(orgId);
  const form = useForm<OrgSourcesForm>({
    resolver: orgSourcesFormResolver,
    defaultValues: { sources: [blank] },
  });
  const rows = useFieldArray({ control: form.control, name: 'sources' });

  const onOpened = useEffectEvent(() => form.reset({ sources: [blank] }));
  useEffect(() => {
    if (open) onOpened();
  }, [open]);

  const submit = form.handleSubmit(async ({ sources }) => {
    const failed: { row: OrgSourceForm; errors: Record<string, string> }[] = [];
    for (const row of sources) {
      try {
        await save.mutateAsync(row);
      } catch (error) {
        const errors = serverFieldErrors(error);
        failed.push({
          row,
          errors: Object.keys(errors).length
            ? errors
            : { url: extractError(error) },
        });
      }
    }
    const added = sources.length - failed.length;
    if (added)
      toastUtils.success(
        added === 1 ? 'Source added' : `${added} sources added`
      );
    if (!failed.length) return onClose();
    form.reset({ sources: failed.map((f) => f.row) });
    failed.forEach(({ errors }, index) => {
      for (const [name, message] of Object.entries(errors)) {
        form.setError(`sources.${index}.${name as keyof OrgSourceForm}`, {
          message,
        });
      }
    });
    toastUtils.error(
      failed.length === 1
        ? 'One source could not be added'
        : `${failed.length} sources could not be added`
    );
  });

  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      dismissible={!form.formState.isDirty}
      size="lg"
      title={copy.addTitle}
      description={copy.addDescription}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-sources-form"
            disabled={save.isPending}
          >
            {save.isPending
              ? 'Adding…'
              : rows.fields.length === 1
                ? 'Add source'
                : `Add ${rows.fields.length} sources`}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          method="post"
          id="add-sources-form"
          onSubmit={submit}
          className="space-y-4"
        >
          {rows.fields.map((field, index) => (
            <fieldset
              key={field.id}
              className="space-y-3 rounded-lg border border-border p-3"
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <FormTextField
                    control={form.control}
                    name={`sources.${index}.url`}
                    autoComplete="url"
                    label="Link"
                    type="url"
                    placeholder={copy.url}
                    required
                  />
                </div>
                {rows.fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-6"
                    aria-label={`Remove source ${index + 1}`}
                    onClick={() => rows.remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormTextField
                control={form.control}
                name={`sources.${index}.label`}
                autoComplete="off"
                label="Label"
                placeholder={copy.label}
              />
              <FormTextareaField
                control={form.control}
                name={`sources.${index}.notes`}
                autoComplete="off"
                label="Notes"
                placeholder={copy.notes}
                rows={2}
              />
              <FormSwitchField
                control={form.control}
                name={`sources.${index}.enabled`}
                label="Active"
                description="Read this source in every search."
              />
            </fieldset>
          ))}
          {rows.fields.length < 20 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => rows.append({ ...blank })}
            >
              <Plus className="h-4 w-4" /> Add another
            </Button>
          )}
        </form>
      </Form>
    </AppSheet>
  );
}
