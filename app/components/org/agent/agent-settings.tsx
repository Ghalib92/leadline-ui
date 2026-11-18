import { useEffect, useEffectEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useFieldArray, useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AGENT_SOURCES, OPPORTUNITY_TYPES, labelOf } from '~/data';
import { businessCategories } from '~/data/org-taxonomy';
import {
  agentInputResolver,
  toAgentInput,
  type Agent,
  type AgentInput,
  type AgentScope,
  type ScopeOrigin,
} from '~/lib/schema';
import { goalItems, useGoalOptions, useUpdateAgent } from '~/features/agents';
import { useFolders } from '~/features/orgs';
import { useRunSettings } from '~/features/runs';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { AppCard, AppSheet } from '~/components/composed';
import { ScopeChips } from './scope-chips';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import {
  FormPickerField,
  FormSwitchField,
  FormTagInputField,
  FormTextareaField,
  FormTextField,
} from '~/components/form-fields';

const schedules = [
  { value: 'manual', label: 'Only when I run it' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
];
const depthLabel = { quick: 'Quick', standard: 'Standard', deep: 'Deep' };

/** The settings sections; each is shown read-only and edited in its own sheet. */
const sections = {
  basics: {
    title: 'Basics',
    description:
      "What it looks for, what it's called, how often it runs and how deep it searches.",
    fields: ['goal', 'name', 'description', 'schedule', 'depth'],
  },
  instructions: {
    title: 'Worker brief',
    description:
      'Specific guidance and focus areas to steer this worker during searches and evaluation.',
    fields: ['instructions'],
  },
  customers: {
    title: 'Customers and places',
    description:
      'Which businesses and places this worker searches. Empty uses your Clients brief.',
    fields: ['customerTypes', 'places'],
  },
  sources: {
    title: 'Sources',
    description: "Where it looks, on top of your organization's sources.",
    fields: ['sources', 'links'],
  },
  lookFor: {
    title: 'What to look for',
    description:
      "Opportunity types and keywords, on top of your organization's.",
    fields: ['opportunityTypes', 'keywords'],
  },
  documents: {
    title: 'Company documents',
    description:
      'Which of your documents the AI reads to judge fit and write briefs.',
    fields: ['folders'],
  },
} as const satisfies Record<
  string,
  { title: string; description: string; fields: readonly (keyof AgentInput)[] }
>;
type SectionKey = keyof typeof sections;
const isSection = (value: string | null): value is SectionKey =>
  !!value && value in sections;

const knowledgeLabel = {
  all: 'All documents: every folder is read',
  selected: 'Only selected folders',
  none: 'No documents, unless this worker adds folders',
} as const;

const fromOrg = <T extends { origin: string }>(rows: T[]) =>
  rows.filter((row) => row.origin === 'organization');

/** One line on what a run searches, and how much of it this automation adds. */
export function scopeSummary(scope: AgentScope) {
  const parts = [
    [scope.sources.length, 'source type'],
    [scope.opportunityTypes.length, 'opportunity type'],
    [scope.folders.length, 'folder'],
    [scope.links.length, 'website'],
  ] as const;
  const rows: { origin: string }[][] = [
    scope.sources,
    scope.opportunityTypes,
    scope.keywords,
    scope.folders,
    scope.links,
  ];
  const added = rows.reduce(
    (n, list) => n + list.length - fromOrg(list).length,
    0
  );
  const text = parts
    .map(([n, noun]) => `${n} ${noun}${n === 1 ? '' : 's'}`)
    .join(' · ');
  return { text, added };
}

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

/**
 * An automation's settings, shown as saved. The organization's search settings
 * always apply; each section lists them with what this automation adds, and its
 * Edit opens a sheet (`?edit=<section>`) that saves only that section.
 */
export function AgentSettings({
  agent,
  canManage,
}: Readonly<{ agent: Agent; canManage: boolean }>) {
  const path = useOrgPath();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('edit');
  const editing = canManage && isSection(requested) ? requested : null;
  const setEditing = (section: SectionKey | null) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (section) params.set('edit', section);
        else params.delete('edit');
        return params;
      },
      { replace: true }
    );

  const scope = agent.effective;
  const tag = <T,>(
    rows: (T & { origin: ScopeOrigin })[],
    text: (row: T) => string
  ) => rows.map((row) => ({ text: text(row), origin: row.origin }));
  const disabledLinks = agent.links.filter((l) => !l.enabled).length;
  const summary = scope ? scopeSummary(scope) : null;
  const settingsTab = (tab: string) => path(`/settings/general?tab=${tab}`);
  const goal = useGoalOptions(agent.goal).find((g) => g.value === agent.goal);

  const section = (key: SectionKey, children: ReactNode) => (
    <AppCard
      key={key}
      title={sections[key].title}
      description={sections[key].description}
      actions={
        canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(key)}
            aria-label={`Edit ${sections[key].title.toLowerCase()}`}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )
      }
    >
      <dl className="divide-y divide-border">{children}</dl>
    </AppCard>
  );

  return (
    <div className="space-y-4">
      {summary && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <p>
            Each run searches {summary.text}.{' '}
            <span className="text-muted-foreground">
              {summary.added === 0
                ? 'All of it comes from your organization.'
                : `${summary.added} added by this worker.`}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Grey items come from your organization's{' '}
            <Link
              to={settingsTab('runs')}
              className="text-primary hover:underline"
            >
              search settings
            </Link>{' '}
            and apply to every worker. Blue items are added here.
          </p>
        </div>
      )}

      {section(
        'basics',
        <>
          <Row label="Looks for">
            {goal?.label ?? agent.goal}
            {goal && !goal.available && (
              <span className="text-muted-foreground">
                {' '}
                (searching arrives in the next update)
              </span>
            )}
          </Row>
          <Row label="Name">{agent.name}</Row>
          <Row label="Description">
            {agent.description || (
              <span className="text-muted-foreground">None</span>
            )}
          </Row>
          <Row label="Schedule">
            {schedules.find((s) => s.value === agent.schedule)?.label}
          </Row>
          <Row label="Depth">
            {scope ? depthLabel[scope.depth.value] : '–'}{' '}
            <span className="text-muted-foreground">
              {scope?.depth.origin === 'agent'
                ? '(set on this worker)'
                : '(organization default)'}
            </span>
          </Row>
        </>
      )}

      {section(
        'instructions',
        <>
          <Row label="Worker brief">
            {agent.instructions ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {agent.instructions}
              </p>
            ) : (
              <span className="text-muted-foreground">
                No custom brief set. The worker uses default evaluation prompts
                and organization preferences.
              </span>
            )}
          </Row>
        </>
      )}

      {agent.goal === 'clients' &&
        section(
          'customers',
          <>
            <Row label="Kinds of customer">
              {agent.customerTypes.length ? (
                agent.customerTypes
                  .map((v) => labelOf(businessCategories, v))
                  .join(', ')
              ) : (
                <span className="text-muted-foreground">
                  From your Clients brief
                </span>
              )}
            </Row>
            <Row label="Places">
              {agent.places.length ? (
                agent.places.join(', ')
              ) : (
                <span className="text-muted-foreground">
                  Your Clients brief&apos;s cities
                </span>
              )}
            </Row>
          </>
        )}

      {section(
        'sources',
        <>
          <Row label="Source types">
            <ScopeChips
              items={tag(scope?.sources ?? [], (r: { value: string }) =>
                labelOf(AGENT_SOURCES, r.value)
              )}
            />
          </Row>
          <Row label="Websites">
            <ScopeChips
              items={tag(
                scope?.links ?? [],
                (r: { url: string; label: string }) => r.label || r.url
              )}
            />
            {disabledLinks > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {disabledLinks} switched off.
              </p>
            )}
          </Row>
        </>
      )}

      {section(
        'lookFor',
        <>
          <Row label="Opportunity types">
            <ScopeChips
              items={tag(
                scope?.opportunityTypes ?? [],
                (r: { value: string }) => labelOf(OPPORTUNITY_TYPES, r.value)
              )}
            />
          </Row>
          <Row label="Keywords">
            <ScopeChips
              items={tag(
                scope?.keywords ?? [],
                (r: { value: string }) => r.value
              )}
            />
          </Row>
        </>
      )}

      {section(
        'documents',
        <>
          <Row label="Organization setting">
            {knowledgeLabel[scope?.knowledgeMode ?? 'all']}
          </Row>
          {/* With all documents, folders add nothing; otherwise they are what runs read. */}
          {scope?.knowledgeMode !== 'all' && (
            <Row label="Folders read">
              <ScopeChips
                items={tag(
                  (scope?.folders ?? []).filter(
                    (f) =>
                      scope?.knowledgeMode === 'selected' ||
                      f.origin === 'agent'
                  ),
                  (r: { name: string }) => r.name
                )}
              />
            </Row>
          )}
        </>
      )}

      <AgentSettingsSheet
        agent={agent}
        section={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

/** The form for one section; it saves only that section's fields. */
function AgentSettingsSheet({
  agent,
  section,
  onClose,
}: Readonly<{
  agent: Agent;
  section: SectionKey | null;
  onClose: () => void;
}>) {
  const { org } = useOrg();
  const update = useUpdateAgent(org.id);
  const { data: folders = [] } = useFolders(org.id);
  const { data: runSettings } = useRunSettings(org.id);
  const goals = useGoalOptions(agent.goal);
  const goal = goals.find((g) => g.value === agent.goal);
  const scope = agent.effective;

  // Only what fits the worker's goal is offered (all of it until goals load).
  const goalSources = goal
    ? AGENT_SOURCES.filter((s) => goal.sources.includes(s.value))
    : AGENT_SOURCES;
  const goalTypes = goal
    ? OPPORTUNITY_TYPES.filter((t) => goal.opportunityTypes.includes(t.value))
    : OPPORTUNITY_TYPES;

  // What the organization already covers isn't offered again.
  const orgSources = new Set(fromOrg(scope?.sources ?? []).map((r) => r.value));
  const orgTypes = new Set(
    fromOrg(scope?.opportunityTypes ?? []).map((r) => r.value)
  );
  const orgKeywords = new Set(
    fromOrg(scope?.keywords ?? []).map((r) => r.value)
  );
  const orgFolders = new Set(fromOrg(scope?.folders ?? []).map((r) => r.id));
  const orgLinks = new Set(fromOrg(scope?.links ?? []).map((r) => r.url));

  const defaults = (): AgentInput => {
    const input = toAgentInput(agent);
    return {
      ...input,
      sources: input.sources.filter((v) => !orgSources.has(v)),
      opportunityTypes: input.opportunityTypes.filter((v) => !orgTypes.has(v)),
      keywords: input.keywords.filter((v) => !orgKeywords.has(v)),
      folders: input.folders.filter((v) => !orgFolders.has(v)),
      links: input.links.filter((l) => !orgLinks.has(l.url)),
    };
  };

  const form = useForm<AgentInput>({
    resolver: agentInputResolver,
    defaultValues: defaults(),
  });
  const links = useFieldArray({ control: form.control, name: 'links' });

  // Start from the saved values each time a section opens.
  const onOpened = useEffectEvent(() => form.reset(defaults()));
  useEffect(() => {
    if (section) onOpened();
  }, [section]);

  // Validate and send only this section, so a value elsewhere can't block saving it.
  const onSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!section) return;
    const fields: readonly (keyof AgentInput)[] = sections[section].fields;
    if (!(await form.trigger([...fields]))) return;
    const input = form.getValues();
    const changes = Object.fromEntries(
      fields.map((field) => [field, input[field]])
    ) as Partial<AgentInput>;
    try {
      await update.mutateAsync({ agentId: agent.id, input: changes });
      toastUtils.success('Worker saved');
      onClose();
    } catch (error) {
      toastUtils.error('Could not save the worker', extractError(error));
    }
  };

  const orgDepth =
    runSettings?.depths.find((d) => d.value === runSettings.depth)?.label ??
    'Standard';
  const meta = section ? sections[section] : null;

  return (
    <AppSheet
      open={!!section}
      onOpenChange={(open) => !open && onClose()}
      // Escape and clicking outside close it until something is changed.
      dismissible={!form.formState.isDirty}
      size="lg"
      title={meta ? `Edit ${meta.title.toLowerCase()}` : ''}
      description={meta?.description}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="agent-settings"
            disabled={update.isPending}
          >
            Save changes
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form id="agent-settings" onSubmit={onSubmit} className="space-y-4">
          {section === 'basics' && (
            <>
              <FormPickerField
                control={form.control}
                name="goal"
                label="What it looks for"
                description="Changing it removes extra sources and types that don't fit the new goal."
                options={goalItems(goals)}
                searchable={false}
                clearable={false}
                required
              />
              <FormTextField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Health grants in East Africa"
                autoComplete="off"
                required
              />
              <FormTextareaField
                control={form.control}
                name="description"
                label="Description"
                placeholder="What this worker looks for, in a sentence"
                rows={2}
              />
              <FormPickerField
                control={form.control}
                name="schedule"
                label="Schedule"
                options={schedules}
                searchable={false}
                clearable={false}
              />
              <FormPickerField
                control={form.control}
                name="depth"
                label="How deep to search"
                placeholder={`Organization default (${orgDepth})`}
                options={runSettings?.depths ?? []}
                searchable={false}
              />
            </>
          )}

          {section === 'instructions' && (
            <FormTextareaField
              control={form.control}
              name="instructions"
              label="Worker brief"
              description="Provide a custom brief to guide this worker. Be specific about what you want it to look for, prioritize, or avoid during discovery runs."
              placeholder="e.g. Focus on grants supporting climate resilience in East Africa, avoid matching equity requirements, prioritize calls with deadlines at least 30 days away."
              rows={6}
            />
          )}

          {section === 'customers' && (
            <>
              <FormPickerField
                control={form.control}
                name="customerTypes"
                label="Kinds of customer"
                placeholder="From your Clients brief"
                options={businessCategories}
                multi
                optionStyle="checkbox"
              />
              <FormTagInputField
                control={form.control}
                name="places"
                label="Places (empty: your Clients brief's cities)"
                placeholder="e.g. Nairobi, then Enter"
                maxTags={10}
              />
            </>
          )}

          {section === 'sources' && (
            <>
              <FormPickerField
                control={form.control}
                name="sources"
                label="Extra source types"
                placeholder={
                  goalSources.length === 0
                    ? 'Sources for this goal arrive in the next update'
                    : goalSources.every((s) => orgSources.has(s.value))
                      ? 'Your organization already uses every source type'
                      : 'Add a source type'
                }
                options={goalSources.filter((s) => !orgSources.has(s.value))}
                multi
                optionStyle="checkbox"
                searchable={false}
              />
              <div className="space-y-3">
                <p className="text-sm font-medium">Extra websites</p>
                {links.fields.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    A funder's calls page, a portal or a listing this worker
                    should always read.
                  </p>
                )}
                {links.fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 rounded-lg border border-border p-3"
                  >
                    <FormTextField
                      control={form.control}
                      name={`links.${index}.url`}
                      label="Website"
                      type="url"
                      placeholder="https://funder.org/calls"
                      autoComplete="url"
                      required
                    />
                    <FormTextField
                      control={form.control}
                      name={`links.${index}.label`}
                      label="Label"
                      placeholder="Funder calls page"
                      autoComplete="off"
                    />
                    <FormTextareaField
                      control={form.control}
                      name={`links.${index}.notes`}
                      label="Note for the AI"
                      placeholder="Only the open calls section; skip anything marked closed"
                      rows={2}
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <FormSwitchField
                          control={form.control}
                          name={`links.${index}.enabled`}
                          label="Read this website"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${form.getValues(`links.${index}.url`) || 'website'}`}
                        onClick={() => links.remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    links.append({
                      url: '',
                      label: '',
                      notes: '',
                      enabled: true,
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> Add website
                </Button>
              </div>
            </>
          )}

          {section === 'lookFor' && (
            <>
              <FormPickerField
                control={form.control}
                name="opportunityTypes"
                label="Extra opportunity types"
                placeholder={
                  goalTypes.length === 0
                    ? 'No opportunity types for this goal'
                    : goalTypes.every((t) => orgTypes.has(t.value))
                      ? 'Your organization already looks for every type'
                      : 'Add a type'
                }
                options={goalTypes.filter((t) => !orgTypes.has(t.value))}
                multi
                optionStyle="checkbox"
                searchable={false}
              />
              <FormTagInputField
                control={form.control}
                name="keywords"
                label="Extra keywords"
                placeholder="e.g. maternal health, then Enter"
                maxTags={20}
              />
            </>
          )}

          {section === 'documents' && (
            <>
              {scope?.knowledgeMode === 'all' && (
                <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Your organization lets every run read all documents, so extra
                  folders change nothing until that setting changes.
                </p>
              )}
              <FormPickerField
                control={form.control}
                name="folders"
                label="Extra folders"
                placeholder={
                  folders.length === 0 ? 'No folders yet' : 'Add a folder'
                }
                options={folders
                  .filter((f) => !orgFolders.has(f.id))
                  .map((f) => ({
                    value: f.id,
                    label: f.name,
                    description: f.purpose || undefined,
                  }))}
                multi
                optionStyle="checkbox"
                displayMode="inline"
              />
            </>
          )}
        </form>
      </Form>
    </AppSheet>
  );
}
