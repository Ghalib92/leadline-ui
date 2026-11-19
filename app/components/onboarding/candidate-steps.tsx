import { useFormContext } from 'react-hook-form';
import type { CandidateOnboarding } from '~/lib/schema';
import { countryOptions } from '~/data/org-taxonomy';
import { useStepValidator } from '~/components/ui/multi-step-form';
import {
  FormPickerField,
  FormTextareaField,
  FormTextField,
} from '~/components/form-fields';
import { OrgFields } from '~/components/org/org-profile-fields';

function useValidate(fields: (keyof CandidateOnboarding)[]) {
  const { trigger } = useFormContext<CandidateOnboarding>();
  useStepValidator(() => trigger(fields));
}

/** Who the job seeker is and where they are. */
export function StepAboutYou() {
  useValidate(['name', 'country', 'city', 'description']);
  const { control } = useFormContext<CandidateOnboarding>();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormTextField
          control={control}
          name="name"
          label="Your name"
          autoComplete="name"
          required
        />
      </div>
      <FormPickerField
        control={control}
        name="country"
        label="Country you live in"
        placeholder="Choose a country"
        options={countryOptions()}
        clearable={false}
        required
      />
      <FormTextField
        control={control}
        name="city"
        label="City"
        placeholder="e.g. Nairobi"
        autoComplete="address-level2"
      />
      <div className="sm:col-span-2">
        <FormTextareaField
          control={control}
          name="description"
          label="About you"
          placeholder="e.g. Backend developer with 4 years of Python and Django, building payment systems."
          rows={3}
          required
        />
      </div>
    </div>
  );
}

/** The jobs they want (their job preferences; more on the Workers page later). */
export function StepJobsYouWant() {
  useValidate(['targetRoles', 'headline', 'skills', 'yearsExperience']);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Your searches look through company career pages and job boards for
        these, and score each job against your CV. You upload your CV next.
      </p>
      <OrgFields
        names={[
          'targetRoles',
          'headline',
          'seniority',
          'workplaces',
          'skills',
          'yearsExperience',
        ]}
        required={['targetRoles']}
      />
    </div>
  );
}
