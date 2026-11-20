import type { PickerItem } from '~/components/ui/picker';
import type { Goal, GoalOption } from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useRunSettings } from '../runs/queries';
import { useSetupStatus } from '../orgs/queries';

/** A job seeker's searches wait for their CV; the reason, or null. */
export const NO_CV = 'Upload your CV first: every job is scored against it.';

export function useNeedsCv(): boolean {
  const { view } = useOrg();
  const { data } = useSetupStatus(view.isCandidate ? view.id : '');
  return (
    !!view.isCandidate &&
    !!data?.steps.some((step) => step.key === 'cv' && !step.done)
  );
}

/** The goals a worker may have: those the organization picked (all of them if it
 * picked none), plus the worker's own `current` goal if the organization has
 * since dropped it. Each says what it searches and whether it can run yet. */
export function useGoalOptions(current?: Goal): GoalOption[] {
  const { org, view } = useOrg();
  const { data } = useRunSettings(org.id);
  return goalsFor(data?.goals ?? [], view.profile.goals, current);
}

export function goalsFor(
  all: readonly GoalOption[],
  picked: readonly Goal[],
  current?: Goal
): GoalOption[] {
  if (picked.length === 0) return [...all];
  return all.filter((g) => picked.includes(g.value) || g.value === current);
}

/** Picker rows: the goal's description, and a note when it can't run yet. */
export const goalItems = (goals: readonly GoalOption[]): PickerItem[] =>
  goals.map((g) => ({
    value: g.value,
    label: g.label,
    description: g.available
      ? g.description
      : `${g.description}. Searching arrives in the next update.`,
  }));

/** A new worker's goal: the first one that can run, else the first. */
export const defaultGoal = (goals: readonly GoalOption[]): Goal =>
  (goals.find((g) => g.available) ?? goals[0])?.value ?? 'grants';

/** Why a worker with this goal can't run yet, or null when it can. */
export function useRunBlocked(): (goal: Goal) => string | null {
  const { org } = useOrg();
  const { data } = useRunSettings(org.id);
  const needsCv = useNeedsCv();
  return (goal) => {
    if (needsCv) return NO_CV;
    const option = data?.goals.find((g) => g.value === goal);
    return option && !option.available
      ? `Searching for ${option.label.toLowerCase()} arrives in the next update.`
      : null;
  };
}
