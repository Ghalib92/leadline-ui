/**
 * Where the workers look. Keep in step with the backend's
 * apps/ai/config/sources.yaml: only sources Leadline really searches.
 */
const ROWS = [
  [
    'tenders.go.ke',
    'Grants.gov',
    'World Bank projects',
    'EU Funding & Tenders',
    'TED, EU public tenders',
    'Kenyan government sites',
    'OpenStreetMap',
    'News and announcements',
  ],
  [
    'BrighterMonday',
    'Fuzu',
    'MyJobMag',
    'Career Point Kenya',
    'Greenhouse career pages',
    'Lever career pages',
    'Ashby career pages',
    'Workable career pages',
  ],
];

function Row({
  items,
  reverse = false,
}: Readonly<{ items: string[]; reverse?: boolean }>) {
  return (
    <div className="flex overflow-hidden">
      {/* Two copies side by side; the strip slides by one copy and repeats. */}
      <div
        className={
          reverse
            ? 'animate-marquee-reverse flex shrink-0'
            : 'animate-marquee flex shrink-0'
        }
      >
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 gap-3 pr-3"
          >
            {items.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium whitespace-nowrap text-foreground/80"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export function SourcesMarquee() {
  return (
    <section className="group border-b border-border bg-muted/40 py-10">
      <p className="text-center text-sm font-medium text-muted-foreground">
        Your workers search 16 sources, every day or every week, on their own
      </p>
      <div className="mt-6 space-y-3">
        <Row items={ROWS[0]} />
        <Row items={ROWS[1]} reverse />
      </div>
    </section>
  );
}
