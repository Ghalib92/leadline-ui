import { useWatch, type Control } from 'react-hook-form';
import { AGENT_SOURCES, OPPORTUNITY_TYPES } from '~/data';
import { useFolders } from '~/features/orgs';
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

/** Depth, sources, types and company documents: the Search settings tab and
 * "Configure this run". */
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
  const knowledgeMode = useWatch({ control, name: 'knowledgeMode' });
  return (
    <>
      <FormPickerField
        control={control}
        name="depth"
        label="Depth"
        options={depths}
        placeholder="How thorough?"
        searchable={false}
        clearable={false}
        readOnly={readOnly}
      />
      <FormPickerField
        control={control}
        name="sources"
        label="Sources"
        options={AGENT_SOURCES}
        placeholder="Where to look"
        multi
        optionStyle="checkbox"
        searchable={false}
        readOnly={readOnly}
      />
      <FormPickerField
        control={control}
        name="opportunityTypes"
        label="Opportunity types"
        options={[...OPPORTUNITY_TYPES]}
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
