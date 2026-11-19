import { Bot } from 'lucide-react';
import { cn } from '~/lib/utils';

/** Illustrative only: made-up finds, in the app's own badge colours. */
const ROWS = [
  {
    title: 'Hotel group with no online booking',
    meta: 'Nairobi · needs a website and payments',
    type: 'Client lead',
    tone: 'bg-sky-500/10 text-sky-700',
    score: 91,
  },
  {
    title: 'Supply and installation of an ERP system',
    meta: 'A state corporation · closes 22 Nov',
    type: 'Tender',
    tone: 'bg-indigo-500/10 text-indigo-700',
    score: 84,
  },
  {
    title: 'Backend developer, payments team',
    meta: 'Remote, Africa · fits your CV',
    type: 'Job',
    tone: 'bg-teal-500/10 text-teal-700',
    score: 78,
  },
  {
    title: 'Digital skills for youth programme',
    meta: 'A youth employment fund · grant',
    type: 'Grant',
    tone: 'bg-emerald-500/10 text-emerald-700',
    score: 66,
  },
];

/** A window onto the app: a worker running and what it found. */
export function ProductPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-sidebar/10">
      {/* Window bar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-xs font-medium text-muted-foreground">
          Opportunities
        </span>
      </div>

      {/* The worker */}
      <div className="flex items-center gap-3 bg-sidebar px-4 py-3 text-sidebar-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Clients and tenders worker</p>
          <p className="text-xs text-sidebar-foreground/60">
            Searching 16 sources · 18 new this week
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/25 px-2 py-0.5 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
          Running
        </span>
      </div>
      <div className="h-1 bg-sidebar">
        <div className="h-full animate-grow-x bg-gold" />
      </div>

      {/* What it found */}
      <ul className="divide-y divide-border">
        {ROWS.map((row, i) => (
          <li
            key={row.title}
            className={cn(
              'flex animate-fade-up items-center gap-3 px-4 py-3',
              i === 0 && 'bg-gold/10'
            )}
            style={{ '--delay': `${0.3 + i * 0.12}s` } as React.CSSProperties}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                    row.tone
                  )}
                >
                  {row.type}
                </span>
                <p className="truncate text-sm font-medium">{row.title}</p>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {row.meta}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums',
                row.score >= 80
                  ? 'bg-gold/15 text-gold-foreground ring-1 ring-gold/40'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {row.score}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
