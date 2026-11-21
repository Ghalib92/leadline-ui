import { FileText, Plus, Sparkles } from 'lucide-react';
import { useDismissCvSuggestions, useUpdateJobBrief } from '~/features/orgs';
import type { CvProfile, JobBrief } from '~/lib/schema';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { Button } from '~/components/ui/button';
import { AppCard } from '~/components/composed';

const FILLED_LABELS: Record<string, string> = {
  headline: 'headline',
  target_roles: 'jobs you want',
  skills: 'skills',
  years_experience: 'years of experience',
  seniority: 'level',
  workplaces: 'where you work',
  employment_types: 'kind of work',
};

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Why the CV can't be read again yet, or null when it can. */
export function readLimitText(read: JobBrief['cvRead']): string | null {
  if (read.blocked === 'daily')
    return `Read ${read.readsPerDay} times today. You can read it again tomorrow.`;
  if (read.blocked === 'cooldown' && read.nextReadAt)
    return `You can read it again at ${clock(read.nextReadAt)} (at most once every ${read.cooldownMinutes} minutes, ${read.readsPerDay} times a day).`;
  return null;
}

const lower = (items: string[]) => new Set(items.map((i) => i.toLowerCase()));

/**
 * What reading the CV found: everything Leadline now knows from it (searches,
 * scoring and applications use all of it), with its skills and job titles to add
 * to the preferences. Reading again is limited: each read costs tokens.
 */
export function CvFindings({
  orgId,
  brief,
  canEdit,
  reading,
  onRead,
}: Readonly<{
  orgId: string;
  brief: JobBrief;
  canEdit: boolean;
  reading: boolean;
  onRead: () => void;
}>) {
  const update = useUpdateJobBrief(orgId);
  const dismiss = useDismissCvSuggestions(orgId);
  const found = brief.cvSuggestions;
  const profile = brief.cvProfile;
  const limit = readLimitText(brief.cvRead);

  const listed = lower(brief.skills);
  const newSkills = (profile?.skills ?? found?.skills ?? []).filter(
    (skill) => !listed.has(skill.toLowerCase())
  );
  const newRoles = found?.targetRoles ?? [];

  const add = (patch: { targetRoles?: string[]; skills?: string[] }) =>
    update.mutate(
      {
        ...(patch.targetRoles && {
          targetRoles: [...brief.targetRoles, ...patch.targetRoles],
        }),
        ...(patch.skills && { skills: [...brief.skills, ...patch.skills] }),
      },
      {
        onError: (error) =>
          toastUtils.error('Could not add it', extractError(error)),
      }
    );

  const addButton = (item: string, field: 'targetRoles' | 'skills') => (
    <button
      key={item}
      type="button"
      disabled={!canEdit || update.isPending}
      onClick={() => add({ [field]: [item] })}
      className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/50 px-2.5 py-0.5 text-xs text-primary hover:bg-primary/5 disabled:opacity-60"
      aria-label={`Add ${item}`}
    >
      <Plus className="h-3 w-3" /> {item}
    </button>
  );

  return (
    <AppCard
      title="From your CV"
      description={
        found
          ? `Read from “${found.documentTitle}” ${timeAgo(found.readAt)}. Your searches and applications use all of it.`
          : 'Upload your CV and Leadline reads it: your jobs, skills and education, for your searches and applications.'
      }
      actions={
        canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRead}
            disabled={reading || !!limit}
            title={limit ?? undefined}
          >
            <FileText className="h-3.5 w-3.5" />
            {reading ? 'Reading…' : found ? 'Read my CV again' : 'Read my CV'}
          </Button>
        )
      }
    >
      <div className="space-y-4 text-sm">
        {limit && canEdit && (
          <p className="text-xs text-muted-foreground">{limit}</p>
        )}
        {found && found.filled.length > 0 && (
          <p className="flex gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Filled in your{' '}
            {found.filled.map((f) => FILLED_LABELS[f] ?? f).join(', ')}. Check
            them below.
          </p>
        )}
        {profile && <ProfileFacts profile={profile} />}

        {profile && profile.skills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Skills ({profile.skills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) =>
                listed.has(skill.toLowerCase()) ? (
                  <span
                    key={skill}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
                  >
                    {skill}
                  </span>
                ) : (
                  addButton(skill, 'skills')
                )
              )}
            </div>
          </div>
        )}
        {!profile && found && found.skills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {found.skills.map((skill) => addButton(skill, 'skills'))}
            </div>
          </div>
        )}
        {newRoles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Jobs your CV shows you can do
            </p>
            <div className="flex flex-wrap gap-1.5">
              {newRoles.map((role) => addButton(role, 'targetRoles'))}
            </div>
          </div>
        )}

        {canEdit && (newSkills.length > 0 || newRoles.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              disabled={update.isPending}
              onClick={() =>
                add({
                  ...(newSkills.length > 0 && { skills: newSkills }),
                  ...(newRoles.length > 0 && { targetRoles: newRoles }),
                })
              }
            >
              Add all to my preferences
            </Button>
            {newRoles.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={dismiss.isPending}
                onClick={() => dismiss.mutate()}
              >
                Not these jobs
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Dashed ones aren't in your preferences yet.
            </span>
          </div>
        )}
      </div>
    </AppCard>
  );
}

function ProfileFacts({ profile }: Readonly<{ profile: CvProfile }>) {
  const now = [profile.currentTitle, profile.currentEmployer]
    .filter(Boolean)
    .join(' at ');
  return (
    <div className="space-y-3">
      <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[10rem_1fr]">
        {now && <Fact label="Now">{now}</Fact>}
        {profile.yearsExperience != null && (
          <Fact label="Experience">{profile.yearsExperience} years</Fact>
        )}
        {profile.lookingFor && (
          <Fact label="Looking for">{profile.lookingFor}</Fact>
        )}
        {profile.location && <Fact label="Lives in">{profile.location}</Fact>}
      </dl>
      {profile.summary && (
        <p className="leading-relaxed text-muted-foreground">
          {profile.summary}
        </p>
      )}
      {profile.experience.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Jobs on your CV ({profile.experience.length})
          </p>
          <ul className="space-y-2">
            {profile.experience.map((job, index) => (
              <li key={`${job.title}-${job.employer}-${index}`}>
                <p>
                  <span className="font-medium">{job.title}</span>
                  {job.employer && (
                    <span className="text-muted-foreground">
                      {' '}
                      · {job.employer}
                    </span>
                  )}
                  {(job.start || job.end) && (
                    <span className="text-xs text-muted-foreground">
                      {' '}
                      ({[job.start, job.end].filter(Boolean).join(' – ')})
                    </span>
                  )}
                </p>
                {job.highlights.length > 0 && (
                  <ul className="ml-4 list-disc text-xs text-muted-foreground">
                    {job.highlights.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[10rem_1fr]">
        {profile.education.length > 0 && (
          <Fact label="Education">
            {profile.education
              .map((e) =>
                [e.qualification, e.institution, e.year]
                  .filter(Boolean)
                  .join(', ')
              )
              .join('; ')}
          </Fact>
        )}
        {profile.certifications.length > 0 && (
          <Fact label="Certifications">
            {profile.certifications.join(', ')}
          </Fact>
        )}
        {profile.languages.length > 0 && (
          <Fact label="Languages">{profile.languages.join(', ')}</Fact>
        )}
      </dl>
    </div>
  );
}

function Fact({
  label,
  children,
}: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <>
      <dt className="text-xs font-medium text-muted-foreground sm:pt-0.5">
        {label}
      </dt>
      <dd>{children}</dd>
    </>
  );
}
