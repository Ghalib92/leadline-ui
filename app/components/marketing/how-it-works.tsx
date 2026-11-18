import { Bot, Building2, Target } from 'lucide-react';

const STEPS = [
  {
    icon: Building2,
    title: 'Describe your organization',
    body: 'What you sell, who buys it, where, and the tenders you bid for. Takes five minutes.',
  },
  {
    icon: Bot,
    title: 'Agents scan the sources',
    body: 'Business directories, tender portals, government sites and funders, every day or week, on their own.',
  },
  {
    icon: Target,
    title: 'Approve and win',
    body: 'Every match is scored and explained. Approve one and Leadline writes the pitch or the bid.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-6 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          How it works
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="animate-fade-up animate-on-view rounded-xl border border-border bg-card p-6"
              style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
