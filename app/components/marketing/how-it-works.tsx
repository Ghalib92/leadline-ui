import { Bot, Building2, Check, FileText } from 'lucide-react';

const STEPS = [
  {
    icon: Building2,
    title: 'Tell Leadline what you do',
    body: 'What you sell and to whom, the tenders you bid for, or the job you want. Five minutes, or upload a profile or CV and let it read.',
    visual: (
      <div className="flex flex-wrap gap-1.5">
        {['Web and mobile apps', 'Nairobi, Mombasa', 'Hotels, clinics'].map(
          (chip) => (
            <span
              key={chip}
              className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              {chip}
            </span>
          )
        )}
      </div>
    ),
  },
  {
    icon: Bot,
    title: 'Workers search on their own',
    body: 'Every day or week they read tender portals, directories, funders and job boards, then score each find against you, with the reasons.',
    visual: (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5">
          <span className="text-muted-foreground">tenders.go.ke</span>
          <span className="font-semibold text-primary">12 read</span>
        </div>
        <div className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5">
          <span className="text-muted-foreground">Business directory</span>
          <span className="font-semibold text-primary">31 read</span>
        </div>
      </div>
    ),
  },
  {
    icon: FileText,
    title: 'Approve, and it’s written',
    body: 'Approve a find and Leadline drafts the pitch, the bid or the cover letter and CV, from your own documents. You edit and send it.',
    visual: (
      <div className="flex items-center gap-2 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
        Bid draft ready · 6 sections
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-b border-border">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            From “who should we go after?” to a draft, in three steps.
          </h2>
        </div>
        <ol className="relative mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="animate-fade-up animate-on-view flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm"
              style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar text-sm font-bold text-sidebar-foreground">
                  {i + 1}
                </span>
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
              <div className="mt-auto pt-5">{step.visual}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
