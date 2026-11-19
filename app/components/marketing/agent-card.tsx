import { Bot, Sparkles } from 'lucide-react';

const FINDINGS = [
  {
    title: 'Hotel group with no online booking',
    funder: 'Nairobi · needs a website and payments',
    score: 91,
    tag: 'Client lead',
  },
  {
    title: 'Supply and installation of an ERP system',
    funder: 'A state corporation, Mombasa',
    score: 84,
    tag: 'Tender',
  },
  {
    title: 'Digital Skills for Youth Grant',
    funder: 'A youth employment fund',
    score: 72,
    tag: 'Grant',
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
          <p className="text-sm font-semibold">Clients and tenders worker</p>
          <p className="text-xs text-muted-foreground">
            Scanned 42 sources · just now
          </p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
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
            <span
              className={
                item.score >= 80
                  ? 'rounded-md bg-gold/15 px-2 py-1 text-xs font-semibold text-gold-foreground ring-1 ring-gold/40'
                  : 'rounded-md bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'
              }
            >
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
