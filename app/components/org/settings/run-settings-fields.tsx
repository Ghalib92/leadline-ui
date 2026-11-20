import { useWatch, type Control } from 'react-hook-form';
import { AGENT_SOURCES, OPPORTUNITY_TYPES } from '~/data';
import { useFolders } from '~/features/orgs';
import { useRunSettings } from '~/features/runs';
import type { RunSettingsForm } from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import type { PickerItem } from '~/components/ui/picker';
import { FormPickerField } from '~/components/form-fields';

const knowledgeOptions = [
  {
    value: 'all',
    label: 'All documents',
    description: 'The AI reads every processed document, in every folder.',
  },
  {
    value: 'selected',
    label: 'Only selected folders',
    description: 'Nothing outside the folders you pick.',
  },
  {
    value: 'none',
    label: 'No documents',
    description: 'Judge from the profile only. A search can still add folders.',
  },
];

/**
 * The sources and kinds of opportunity that fit what the organization looks
 * for (its goals), so a business after clients and tenders isn't offered
 * grant databases. Everything when it hasn't picked goals.
 */
export function useSearchScope() {
  const { view } = useOrg();
  const { data: settings } = useRunSettings(view.id);
  const picked = view.profile.goals;
  const goals = (settings?.goals ?? []).filter(
    (goal) => !picked.length || picked.includes(goal.value)
  );
  const sources = new Set(goals.flatMap((goal) => goal.sources));
  const types = new Set<string>(goals.flatMap((goal) => goal.opportunityTypes));
  return {
    sources: sources.size
      ? AGENT_SOURCES.filter((s) => sources.has(s.value))
      : AGENT_SOURCES,
    opportunityTypes: types.size
      ? OPPORTUNITY_TYPES.filter((t) => types.has(t.value))
      : [...OPPORTUNITY_TYPES],
  };
}

/** Depth, sources, types and company documents: the Search settings tab and
 * "Configure this run". A job seeker only chooses the depth: their searches
 * always look for jobs, in career pages and job boards, against their CV. */
export function RunSettingsFields({
  control,
  depths,
  readOnly = false,
}: Readonly<{
  control: Control<RunSettingsForm>;
  depths: PickerItem[];
  readOnly?: boolean;
}>) {
  const { view } = useOrg();
  const { data: folders = [] } = useFolders(view.id);
  const scope = useSearchScope();
  const knowledgeMode = useWatch({ control, name: 'knowledgeMode' });
  const depth = (
    <FormPickerField
      control={control}
      name="depth"
      label="How thorough"
      options={depths}
      placeholder="How thorough?"
      searchable={false}
      clearable={false}
      readOnly={readOnly}
    />
  );
  if (view.isCandidate) return depth;
  return (
    <>
      {depth}
      <FormPickerField
        control={control}
        name="sources"
        label="Where to look"
        options={scope.sources}
        placeholder="Where to look"
        multi
        optionStyle="checkbox"
        searchable={false}
        readOnly={readOnly}
      />
      <FormPickerField
        control={control}
        name="opportunityTypes"
        label="What to look for"
        options={scope.opportunityTypes}
        placeholder="What to look for"
        multi
        optionStyle="checkbox"
        searchable={false}
        readOnly={readOnly}
      />
      <FormPickerField
        control={control}
        name="knowledgeMode"
        label="Company documents"
        options={knowledgeOptions}
        placeholder="Which documents the AI may read"
        searchable={false}
        clearable={false}
        readOnly={readOnly}
      />
      {knowledgeMode === 'selected' && (
        <FormPickerField
          control={control}
          name="folders"
          label="Folders"
          options={folders.map((f) => ({
            value: f.id,
            label: f.name,
            description: f.purpose || undefined,
          }))}
          placeholder={folders.length ? 'Pick folders' : 'No folders yet'}
          multi
          optionStyle="checkbox"
          displayMode="inline"
          readOnly={readOnly}
          required
        />
      )}
    </>
  );
}
