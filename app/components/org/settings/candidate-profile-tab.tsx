import type { DefaultValues } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import { countryOptions } from '~/data/org-taxonomy';
import { labelOf } from '~/data/taxonomy';
import { useUpdateOrg } from '~/features/orgs';
import {
  orgProfileFormResolver,
  type OrgProfile,
  type OrgProfileForm,
  type OrgProfileFormInput,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { Button } from '~/components/ui/button';
import { AppCard } from '~/components/composed';
import { EditSheet } from './edit-sheet';
import { Field, type EditingProps } from './profile-tabs';
import { JobBriefTab } from './brief-tabs';

/** `basics` matches the setup checklist step of the same name. */
const sheets: Record<
  string,
  {
    title: string;
    fields: (keyof OrgProfile)[];
    required?: (keyof OrgProfile)[];
  }
> = {
  basics: {
    title: 'About you',
    fields: ['name', 'description', 'country', 'city'],
    required: ['name', 'description', 'country'],
  },
  contact: {
    title: 'How employers reach you',
    fields: ['contactEmail', 'phone', 'website'],
  },
};

const empty = <span className="text-muted-foreground">—</span>;
const textOrEmpty = (value: string | null | undefined) => value || empty;

/**
 * A job seeker's profile: who they are, how to reach them and the jobs they
 * want. No company fields (legal name, budget, funders…): a person has none.
 */
export function CandidateProfileTab({
  editing,
  setEditing,
}: Readonly<EditingProps>) {
  const { view } = useOrg();
  const update = useUpdateOrg(view.id);
  const canEdit = view.myRole === 'admin' && !view.isArchived;
  const p = view.profile;
  const sheet = editing ? sheets[editing] : undefined;
  const edit = (key: string, label: string) =>
    canEdit && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditing(key)}
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </Button>
    );

  return (
    <div className="space-y-4">
      <AppCard
        title="About you"
        description="Leadline reads this with your CV to judge which jobs fit."
        actions={edit('basics', 'about you')}
      >
        <dl className="divide-y divide-border">
          <Field label="Full name">{p.name}</Field>
          <Field label="About you">{textOrEmpty(p.description)}</Field>
          <Field label="Country">
            {p.country ? labelOf(countryOptions(), p.country) : empty}
          </Field>
          <Field label="City">{textOrEmpty(p.city)}</Field>
        </dl>
      </AppCard>

      <AppCard
        title="How employers reach you"
        description="Used in your cover letters and CVs."
        actions={edit('contact', 'how employers reach you')}
      >
        <dl className="divide-y divide-border">
          <Field label="Email">{textOrEmpty(p.contactEmail)}</Field>
          <Field label="Phone">{textOrEmpty(p.phone)}</Field>
          <Field label="LinkedIn or portfolio">
            {p.website ? (
              <a
                href={p.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {p.website}
              </a>
            ) : (
              empty
            )}
          </Field>
        </dl>
      </AppCard>

      {/* The jobs they want: the same preferences as Searches › Job preferences. */}
      <JobBriefTab editing={editing} setEditing={setEditing} />

      {sheet && (
        <EditSheet<OrgProfileFormInput, OrgProfileForm>
          open
          onClose={() => setEditing(null)}
          title={`Edit ${sheet.title.toLowerCase()}`}
          description="Your searches use it from their next search."
          fields={sheet.fields}
          required={sheet.required}
          resolver={orgProfileFormResolver}
          values={
            Object.fromEntries(
              sheet.fields.map((key) => [key, p[key]])
            ) as DefaultValues<OrgProfileFormInput>
          }
          onSave={(values) => update.mutateAsync(values)}
          pending={update.isPending}
          person
        />
      )}
    </div>
  );
}
