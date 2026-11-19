import { Hand, Lock, ScanSearch } from 'lucide-react';

const POINTS = [
  {
    icon: ScanSearch,
    title: 'It checks its own writing',
    body: 'Before you see a bid or a job application, Leadline checks it against your documents. Claims, names and years they don’t support are rewritten or flagged for you.',
  },
  {
    icon: Hand,
    title: 'You stay in charge',
    body: 'Nothing is sent, applied for or paid without your approval. Leadline finds and drafts; you decide.',
  },
  {
    icon: Lock,
    title: 'Private to your workspace',
    body: 'Your profile, documents and finds are visible only to your workspace’s members. Never shared with other customers.',
  },
];

/** A solid ink band: the one dark section between light ones. */
export function Trust() {
  return (
    <section className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-gold">Built to be trusted</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            AI that does the legwork, and shows its work.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {POINTS.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-sidebar">
                <point.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sidebar-foreground/70">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
