import { useFormContext } from 'react-hook-form';
import type { OnboardingForm } from '~/lib/schema';
import { useStepValidator } from '~/components/ui/multi-step-form';
import { FormPickerField, FormTagInputField } from '~/components/form-fields';
import { OrgFields } from '~/components/org/org-profile-fields';

/**
 * The backend's three required setup steps (basics, focus, preferences),
 * then optional invites. Everything else is on the setup checklist later.
 */
function useValidateFields(fields: (keyof OnboardingForm)[]) {
  const { trigger } = useFormContext<OnboardingForm>();
  useStepValidator(() => trigger(fields));
}

const basicsFields = [
  'name',
  'organizationType',
  'country',
  'description',
] as const;
const focusFields = ['mission', 'offerings', 'sectors'] as const;
const preferenceFields = [
  'opportunityTypes',
  'geographicScopes',
  'targetRegions',
] as const;

export function StepOrganization() {
  useValidateFields([...basicsFields]);
  return <OrgFields names={basicsFields} required={basicsFields} />;
}

export function StepFocus() {
  useValidateFields([...focusFields]);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Agents read this to judge whether an opportunity fits. A mission or a
        list of what you offer — or both.
      </p>
      <OrgFields names={focusFields} required={['sectors']} />
    </div>
  );
}

export function StepPreferences() {
  useValidateFields([...preferenceFields]);
  return (
    <OrgFields
      names={preferenceFields}
      required={['opportunityTypes', 'geographicScopes']}
    />
  );
}

export function StepTeam() {
  useValidateFields(['inviteEmails', 'inviteRole']);
  const { control } = useFormContext<OnboardingForm>();
  return (
    <div className="space-y-4">
      <FormTagInputField
        control={control}
        name="inviteEmails"
        label="Invite teammates by email"
        placeholder="name@organization.org, then Enter"
        maxTags={20}
      />
      <FormPickerField
        control={control}
        name="inviteRole"
        placeholder="Choose a role"
        label="Their role"
        options={[
          {
            value: 'member',
            label: 'Member',
            description: 'Reviews and triages opportunities',
          },
          {
            value: 'admin',
            label: 'Admin',
            description: 'Also edits the organization and manages members',
          },
        ]}
        searchable={false}
        clearable={false}
      />
      <p className="text-sm text-muted-foreground">
        Optional — you can invite people later from Settings.
      </p>
    </div>
  );
}
