import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Opportunity } from '~/lib/schema';
import { formatDate } from '~/lib/utils/format';
import { AppCard } from '~/components/composed';
import { Button } from '~/components/ui/button';

type Job = NonNullable<Opportunity['job']>;

const WORKPLACE: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
};

function Fact({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}

/** A job as its company's career page lists it, with a way to apply there. */
export function JobCard({ job }: Readonly<{ job: Job }>) {
  const facts: [string, string][] = [
    ['Company', job.company],
    ['Location', job.location],
    ['Where you work', WORKPLACE[job.workplace] ?? ''],
    ['Kind of work', job.employmentType],
    ['Team', job.department],
    ['Salary', job.salary],
    ['Posted', job.posted ? formatDate(job.posted) : ''],
  ];
  return (
    <AppCard
      title="Job"
      actions={
        job.applyUrl && (
          <Button asChild size="sm">
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply on their site <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )
      }
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {facts
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <Fact key={label} label={label}>
              {value}
            </Fact>
          ))}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        From the company&apos;s own careers page. Leadline doesn&apos;t apply
        for you.
      </p>
    </AppCard>
  );
}
