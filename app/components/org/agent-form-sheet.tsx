import { useEffect, useEffectEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { agentInputResolver, type AgentInput } from '~/lib/schema';
import {
  defaultGoal,
  goalItems,
  useCreateAgent,
  useGoalOptions,
} from '~/features/agents';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppSheet } from '~/components/composed';
import {
  FormPickerField,
  FormTagInputField,
  FormTextareaField,
  FormTextField,
} from '~/components/form-fields';
import { businessCategories } from '~/data/org-taxonomy';
import type { Goal } from '~/lib/schema';

/** Examples that fit what the worker looks for. */
const GOAL_HINTS: Record<
  Goal,
  { name: string; description: string; brief: string }
> = {
  clients: {
    name: 'Hotels in Nairobi',
    description: 'Hotels that need online booking or a better website',
    brief:
      'e.g. Prefer places with many reviews but a weak or missing website; skip international chains.',
  },
  tenders: {
    name: 'County IT tenders',
    description: 'Government tenders for software, systems and dashboards',
    brief:
      'e.g. Only software and systems, not hardware supply; skip tenders reserved for AGPO groups we are not in.',
  },
  jobs: {
    name: 'Backend developer jobs',
    description: 'Python and Django roles, remote or in Nairobi',
    brief:
      'e.g. Prefer product companies; skip roles that need a security clearance or relocation.',
  },
  grants: {
    name: 'Health grants in East Africa',
    description: 'What this search looks for, in a sentence',
    brief:
      'e.g. Focus on grants supporting climate resilience in East Africa, avoid equity requirements, prefer calls with deadlines at least 30 days away.',
  },
};

const SCHEDULES = [
  { value: 'manual', label: 'Only when I run it' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
];

/** New automation: a name and a schedule. What it adds to the organization's
 * settings is set on its page (Settings tab), which opens after saving. */
export function AgentFormSheet({
  open,
  onOpenChange,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const { org } = useOrg();
  const navigate = useNavigate();
  const path = useOrgPath();
  const create = useCreateAgent(org.id);
  const goals = useGoalOptions();

  const defaults = (): AgentInput => ({
    name: '',
    description: '',
    instructions: '',
    goal: defaultGoal(goals),
    opportunityTypes: [],
    keywords: [],
    sources: [],
    folders: [],
    links: [],
    customerTypes: [],
    places: [],
    depth: null,
    schedule: 'weekly',
    enabled: true,
  });

  const form = useForm<AgentInput>({
    resolver: agentInputResolver,
    defaultValues: defaults(),
  });

  const onOpened = useEffectEvent(() => form.reset(defaults()));
  useEffect(() => {
    if (open) onOpened();
  }, [open]);

  // The goals may load after the sheet opens: move off a goal that isn't offered.
  const goalKeys = goals.map((g) => g.value).join();
  const fitGoal = useEffectEvent(() => {
    if (goals.length && !goals.some((g) => g.value === form.getValues('goal')))
      form.setValue('goal', defaultGoal(goals));
  });
  useEffect(() => {
    fitGoal();
  }, [goalKeys]);

  const goal = form.watch('goal');
  const hints = GOAL_HINTS[goal] ?? GOAL_HINTS.grants;

  const onSubmit = async (input: AgentInput) => {
    try {
      const agent = await create.mutateAsync(input);
      toastUtils.success(
        'Search created',
        "It uses your organization's search settings. Add to them here."
      );
      onOpenChange(false);
      navigate(path(`/agents/${agent.id}?tab=settings`));
    } catch (error) {
      toastUtils.error('Could not create the search', extractError(error));
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      dismissible={false}
      size="lg"
      title="New search"
      description="It searches with your organization's settings. You can add instructions, sources, types, keywords and folders next."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="agent-form" disabled={create.isPending}>
            Create worker
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="agent-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormPickerField
            control={form.control}
            name="goal"
            label="What should it find?"
            description="It searches only the sources and types that fit."
            options={goalItems(goals)}
            loading={goals.length === 0}
            searchable={false}
            clearable={false}
            required
          />
          <FormTextField
            control={form.control}
            name="name"
            label="Name"
            placeholder={hints.name}
            autoComplete="off"
            required
          />
          <FormTextareaField
            control={form.control}
            name="description"
            label="Description"
            placeholder={hints.description}
            rows={2}
          />
          <FormTextareaField
            control={form.control}
            name="instructions"
            label="Extra instructions"
            description="Anything this search should focus on, prefer or avoid."
            placeholder={hints.brief}
            rows={3}
          />
          {goal === 'clients' && (
            <>
              <FormPickerField
                control={form.control}
                name="customerTypes"
                label="Kinds of customer"
                description="Only these, for this search. Leave empty to use what you sell (Searches › What you sell)."
                placeholder="From what you sell"
                options={businessCategories}
                multi
                optionStyle="checkbox"
              />
              <FormTagInputField
                control={form.control}
                name="places"
                label="Places (empty: the places in What you sell)"
                placeholder="e.g. Nairobi, then Enter"
                maxTags={10}
              />
            </>
          )}
          <FormPickerField
            control={form.control}
            name="schedule"
            label="Schedule"
            options={SCHEDULES}
            searchable={false}
            clearable={false}
          />
        </form>
      </Form>
    </AppSheet>
  );
}
