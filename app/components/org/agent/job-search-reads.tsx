import { Link } from 'react-router';
import { Check, CircleAlert } from 'lucide-react';
import type { Agent } from '~/lib/schema';
import { useJobBrief } from '~/features/orgs';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { AppCard } from '~/components/composed';

/**
 * What a job seeker's search reads on every run, and whether each part is there:
 * their CV, their job preferences, and this search's description and instructions.
 */
export function JobSearchReads({ agent }: Readonly<{ agent: Agent }>) {
  const { view } = useOrg();
  const path = useOrgPath();
  const { data: brief } = useJobBrief(view.id, true);
  const cv = brief?.cvProfile;
  const cvLine = cv
    ? [
        [cv.currentTitle, cv.currentEmployer].filter(Boolean).join(' at '),
        cv.skills.length ? `${cv.skills.length} skills` : '',
        cv.experience.length ? `${cv.experience.length} job(s)` : '',
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const rows = [
    {
      label: 'Your CV',
      ok: !!cv,
      detail: cv
        ? cvLine || 'Read'
        : 'Not read yet. Upload it, or read it again, in Profile & CV.',
      to: path('/settings/general?tab=cv'),
    },
    {
      label: 'Your job preferences',
      ok: (brief?.targetRoles.length ?? 0) > 0,
      detail: brief?.targetRoles.length
        ? brief.targetRoles.join(', ')
        : 'Add the jobs you want.',
      to: path('/settings/general?edit=job_brief'),
    },
    {
      label: "This search's description",
      source: sourceOf(agent, 'description'),
      ok: !!agent.description?.trim(),
      detail:
        agent.description?.trim() || 'Missing. Say what this search is for.',
    },
    {
      label: "This search's instructions",
      source: sourceOf(agent, 'instructions'),
      ok: !!agent.instructions?.trim(),
      detail:
        agent.instructions?.trim() ||
        'Missing. Tell it what to look for and what to skip.',
    },
  ];

  return (
    <AppCard
      title="What every run reads"
      description="Leadline plans its searches and scores each job from all of these. The more context, the better the jobs."
    >
      <ul className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex gap-2.5">
            {row.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            )}
            <div className="min-w-0">
              <p className="font-medium">
                {row.to ? (
                  <Link to={row.to} className="hover:underline">
                    {row.label}
                  </Link>
                ) : (
                  row.label
                )}
                {'source' in row && row.source && (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    · {row.source}
                  </span>
                )}
              </p>
              <p className="line-clamp-2 whitespace-pre-wrap text-muted-foreground">
                {row.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {agent.isDefault && (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          This is your default search: Leadline wrote it from your CV, and Run a
          search on Home runs it. Edit anything in Settings. When your CV is
          read again, or your job preferences change, the parts you haven’t
          edited are rewritten to match.
        </p>
      )}
    </AppCard>
  );
}

/** A default search's field: still as the CV wrote it, or the person's own. */
function sourceOf(agent: Agent, field: 'description' | 'instructions') {
  if (!agent.isDefault) return '';
  return agent.followsCv?.includes(field) ? 'from your CV' : 'your words';
}
