import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import { labelOf } from '~/data';
import { useRunSettings, useUpdateRunSettings } from '~/features/runs';
import {
  runSettingsFormResolver,
  toRunSettingsForm,
  type RunSettingsForm,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppCard, AppSheet } from '~/components/composed';
import { RunSettingsFields, useSearchScope } from './run-settings-fields';

const knowledgeLabel = {
  all: 'All documents',
  selected: 'Only selected folders',
  none: 'No documents',
} as const;

function Row({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="grid gap-1 py-3 text-sm first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function Chips({ items }: Readonly<{ items: string[] }>) {
  if (items.length === 0)
    return <span className="text-muted-foreground">None</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The org's search settings, shown as saved: what "Search for opportunities" and
 * every automation use. Admins change them in a sheet; members read.
 */
export function RunSettingsTab() {
  const { view } = useOrg();
  const { data: settings } = useRunSettings(view.id);
  const save = useUpdateRunSettings(view.id);
  const canEdit = view.myRole === 'admin' && !view.isArchived;
  const [editing, setEditing] = useState(false);
  const form = useForm<RunSettingsForm>({ resolver: runSettingsFormResolver });
  const scope = useSearchScope();

  // Start from the saved values each time the sheet opens.
  const onOpened = useEffectEvent(() => {
    if (settings) form.reset(toRunSettingsForm(settings));
  });
  useEffect(() => {
    if (editing) onOpened();
  }, [editing]);

  const submit = form.handleSubmit(async (data) => {
    try {
      await save.mutateAsync(data);
      toastUtils.success('Search settings saved');
      setEditing(false);
    } catch (error) {
      toastUtils.error('Could not save', extractError(error));
    }
  });

  if (!settings) return null;
  const depth =
    settings.depths.find((d) => d.value === settings.depth)?.label ??
    settings.depth;

  // Saved values outside the organization's goals are never searched: hide them.
  const shown = (
    values: string[],
    options: readonly { value: string; label: string }[]
  ) =>
    values
      .filter((v) => options.some((o) => o.value === v))
      .map((v) => labelOf(options, v));

  return (
    <>
      <AppCard
        title="Search settings"
        description={
          view.isCandidate
            ? 'How your job searches look. Every search uses these.'
            : 'What “Search for opportunities” uses. Every search uses these too, plus anything it adds.'
        }
        actions={
          canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              aria-label="Edit search settings"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )
        }
      >
        {view.isCandidate ? (
          <dl className="divide-y divide-border">
            <Row label="How thorough">{depth}</Row>
            <Row label="Where to look">
              Company career pages and job boards, plus your job sites
            </Row>
            <Row label="What to look for">Jobs that fit your CV</Row>
            <Row label="Your CV">Read in every search</Row>
          </dl>
        ) : (
          <dl className="divide-y divide-border">
            <Row label="How thorough">{depth}</Row>
            <Row label="Where to look">
              <Chips items={shown(settings.sources, scope.sources)} />
            </Row>
            <Row label="What to look for">
              <Chips
                items={shown(settings.opportunityTypes, scope.opportunityTypes)}
              />
            </Row>
            <Row label="Company documents">
              {knowledgeLabel[settings.knowledgeMode]}
            </Row>
            {settings.knowledgeMode === 'selected' && (
              <Row label="Folders">
                <Chips items={settings.folders.map((f) => f.name)} />
              </Row>
            )}
          </dl>
        )}
      </AppCard>

      <AppSheet
        open={editing}
        onOpenChange={setEditing}
        dismissible={!form.formState.isDirty}
        title="Edit search settings"
        description="Every search uses these, plus anything it adds."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="run-settings-form"
              disabled={save.isPending}
            >
              Save changes
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            method="post"
            id="run-settings-form"
            onSubmit={submit}
            className="space-y-4"
          >
            <RunSettingsFields
              control={form.control}
              depths={settings.depths}
            />
          </form>
        </Form>
      </AppSheet>
    </>
  );
}
