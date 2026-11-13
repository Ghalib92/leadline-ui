import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  insightDays,
  useInsights,
  useRejectionReasons,
} from '~/features/reviews';
import { opportunityKinds } from '~/data/org-taxonomy';
import type { Insights } from '~/lib/schema';
import { cn } from '~/lib/utils';
import { AppCard } from '~/components/composed';

const kindLabel = (key: string) =>
  opportunityKinds.find((kind) => kind.value === key)?.label ?? key;

/** Dashboard analysis from `insights/`: runs, what was found, and decisions. */
export function InsightsPanel({ orgId }: Readonly<{ orgId: string }>) {
  const [days, setDays] = useState(30);
  const { data, isPending } = useInsights(orgId, days);
  const { data: reasons = [] } = useRejectionReasons(orgId);
  const reasonLabel = (key: string) =>
    reasons.find((reason) => reason.value === key)?.label ?? key;

  return (
    <section aria-labelledby="insights-heading" className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="insights-heading" className="text-lg font-semibold">
          Insights
        </h2>
        <div className="flex gap-1 rounded-full bg-muted p-0.5">
          {insightDays
            .filter((d) => d <= 180)
            .map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={days === d}
                onClick={() => setDays(d)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs',
                  days === d
                    ? 'bg-background font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {d} days
              </button>
            ))}
        </div>
      </div>

      {isPending || !data ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <RunsChart data={data} />
          <ReviewsCard data={data} />
          <BarsCard
            title="Found by type"
            rows={data.byType.map((row) => ({
              label: kindLabel(row.key),
              count: row.count,
            }))}
          />
          <BarsCard
            title="Match scores"
            rows={data.byScore.map((row) => ({
              label: row.label,
              count: row.count,
            }))}
            tone={(i) =>
              i >= 3
                ? 'bg-emerald-500'
                : i === 2
                  ? 'bg-primary'
                  : 'bg-muted-foreground/40'
            }
          />
          <BarsCard
            title="Top sources"
            rows={data.bySource.slice(0, 6).map((row) => ({
              label: row.key,
              count: row.count,
            }))}
          />
          <BarsCard
            title="Why opportunities were rejected"
            empty="No rejections in this period."
            rows={data.rejectionReasons.map((row) => ({
              label: reasonLabel(row.key),
              count: row.count,
            }))}
            tone={() => 'bg-destructive/70'}
          />
        </div>
      )}
    </section>
  );
}

/** Weekly runs, stacked by outcome; weeks without runs are filled in. */
function RunsChart({ data }: Readonly<{ data: Insights }>) {
  const weeks = fillWeeks(data);
  const max = Math.max(1, ...weeks.map((w) => w.runs));
  return (
    <AppCard
      title="Searches per week"
      description={`${data.opportunitiesFound} opportunities found`}
      className="lg:col-span-2"
    >
      <div className="flex h-36 items-end gap-1.5">
        {weeks.map((week) => (
          <div
            key={week.week}
            className="flex h-full min-w-0 flex-1 flex-col justify-end"
            title={`${new Date(week.week).toLocaleDateString()}: ${week.runs} runs, ${week.found} found`}
          >
            <div className="flex flex-col-reverse overflow-hidden rounded-t">
              <div
                className="bg-emerald-500"
                style={{ height: `${(week.succeeded / max) * 128}px` }}
              />
              <div
                className="bg-amber-500"
                style={{ height: `${(week.partial / max) * 128}px` }}
              />
              <div
                className="bg-destructive"
                style={{ height: `${(week.failed / max) * 128}px` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <Legend className="bg-emerald-500" label="Succeeded" />
        <Legend className="bg-amber-500" label="With warnings" />
        <Legend className="bg-destructive" label="Failed" />
      </div>
    </AppCard>
  );
}

function Legend({
  className,
  label,
}: Readonly<{ className: string; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', className)} />
      {label}
    </span>
  );
}

function fillWeeks(data: Insights) {
  const byWeek = new Map(
    data.runsByWeek.map((w) => [new Date(w.week).toDateString(), w])
  );
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const count = Math.min(26, Math.max(1, Math.ceil(data.days / 7)));
  return Array.from({ length: count }, (_, i) => {
    const week = new Date(monday);
    week.setDate(monday.getDate() - (count - 1 - i) * 7);
    return (
      byWeek.get(week.toDateString()) ?? {
        week: week.toISOString(),
        runs: 0,
        succeeded: 0,
        partial: 0,
        failed: 0,
        found: 0,
      }
    );
  });
}

function ReviewsCard({ data }: Readonly<{ data: Insights }>) {
  const { approved, rejected, pending, approvalRate } = data.reviews;
  return (
    <AppCard title="Decisions">
      <p className="text-3xl font-semibold tabular-nums">
        {approvalRate === null ? '—' : `${Math.round(approvalRate * 100)}%`}
      </p>
      <p className="text-sm text-muted-foreground">approval rate</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Approved</dt>
          <dd className="font-semibold text-emerald-600">{approved}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Rejected</dt>
          <dd className="font-semibold text-destructive">{rejected}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">To review</dt>
          <dd className="font-semibold">{pending}</dd>
        </div>
      </dl>
    </AppCard>
  );
}

function BarsCard({
  title,
  rows,
  empty = 'Nothing yet.',
  tone = () => 'bg-primary',
}: Readonly<{
  title: string;
  rows: { label: string; count: number }[];
  empty?: string;
  tone?: (index: number) => string;
}>) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <AppCard title={title}>
      {rows.every((r) => r.count === 0) ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => (
            <li key={row.label} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate">{row.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {row.count}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', tone(i))}
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}
