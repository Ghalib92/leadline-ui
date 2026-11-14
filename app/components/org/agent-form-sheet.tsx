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
  FormTextareaField,
  FormTextField,
} from '~/components/form-fields';

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
    depth: null,
    schedule: 'daily',
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

  const onSubmit = async (input: AgentInput) => {
    try {
      const agent = await create.mutateAsync(input);
      toastUtils.success(
        'Worker created',
        "It uses your organization's search settings. Add to them here."
      );
      onOpenChange(false);
      navigate(path(`/agents/${agent.id}?tab=settings`));
    } catch (error) {
      toastUtils.error('Could not create the worker', extractError(error));
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      dismissible={false}
      size="lg"
      title="New worker"
      description="It searches with your organization's settings. You can add a brief, sources, types, keywords and folders next."
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
          <FormTextareaField
            control={form.control}
            name="instructions"
            label="Worker brief"
            description="Specific guidance or focus areas for this worker to follow during searches and evaluation."
            placeholder="Give a specific brief to guide this worker (e.g. Focus on grants supporting climate resilience in East Africa, avoid matching equity requirements, prioritize calls with deadlines at least 30 days away)."
            rows={3}
          />
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
