import { useFormContext, useWatch } from 'react-hook-form';
import type { Goal, OnboardingForm } from '~/lib/schema';
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
  'goals',
  'description',
] as const;
const focusFields = ['mission', 'offerings', 'sectors'] as const;
/** What you're after: the questions of each goal picked (the backend's brief
 * steps), so a company chasing clients never sees grant questions. */
const goalSections: {
  goal: Goal;
  title: string;
  hint: string;
  fields: (keyof OnboardingForm)[];
  required: (keyof OnboardingForm)[];
}[] = [
  {
    goal: 'clients',
    title: 'Your clients',
    hint: 'What you sell and who buys it. Your workers look for businesses like these.',
    fields: ['services', 'customerTypes', 'targetCities'],
    required: ['services', 'customerTypes'],
  },
  {
    goal: 'tenders',
    title: 'Tenders',
    hint: 'The kinds of tender you bid for.',
    fields: ['tenderCategories'],
    required: ['tenderCategories'],
  },
  {
    goal: 'grants',
    title: 'Grants & funding',
    hint: 'The kinds of funding you want and where.',
    fields: ['opportunityTypes', 'geographicScopes', 'targetRegions'],
    required: ['opportunityTypes', 'geographicScopes'],
  },
];

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
  const { control } = useFormContext<OnboardingForm>();
  const goals = useWatch({ control, name: 'goals' }) ?? [];
  const sections = goalSections.filter((s) => goals.includes(s.goal));
  useValidateFields(sections.flatMap((s) => s.fields));
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.goal} className="space-y-3">
          <div>
            <h3 className="font-medium">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.hint}</p>
          </div>
          <OrgFields names={section.fields} required={section.required} />
        </section>
      ))}
    </div>
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
