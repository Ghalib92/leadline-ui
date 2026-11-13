import { Bot, Sparkles } from 'lucide-react';

const FINDINGS = [
  {
    title: 'Community Health Systems Innovation Grant',
    funder: 'Harambee Health Fund',
    score: 94,
    tag: 'Grant',
  },
  {
    title: 'Call for Consortium Partners: Maternal Health',
    funder: 'Umoja Development Partners',
    score: 88,
    tag: 'Partnership',
  },
  {
    title: 'RFQ: Solar Water Pumping Systems',
    funder: 'Rift Valley Water Board',
    score: 76,
    tag: 'Tender',
  },
];

/** Illustrative "agent at work" card for the landing hero and auth panel. */
export function AgentCard() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Bot className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Health &amp; WASH grants agent
          </p>
          <p className="text-xs text-muted-foreground">
            Scanned 42 sources · just now
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Running
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full animate-grow-x rounded-full bg-primary" />
      </div>

      <ul className="mt-4 space-y-2">
        {FINDINGS.map((item, i) => (
          <li
            key={item.title}
            className="flex animate-fade-up items-center gap-3 rounded-lg border border-border p-3"
            style={
              {
                '--delay': `${0.6 + i * 0.35}s`,
                '--fade-up-distance': '8px',
              } as React.CSSProperties
            }
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {item.tag} · {item.funder}
              </p>
            </div>
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {item.score}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        18 new opportunities this week
      </p>
    </div>
  );
}
