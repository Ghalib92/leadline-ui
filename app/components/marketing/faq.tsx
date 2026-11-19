import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Where do the workers look?',
    a: 'Business directories and the web for client leads; tenders.go.ke, government sites and international procurement portals for tenders; funders and grant databases for funding; company career pages and Kenyan job boards for jobs. Sources are built in: there is nothing to set up before your first search.',
  },
  {
    q: 'How are matches scored?',
    a: 'Each find is scored from 0 to 100 against what you told Leadline: what you sell and to whom, the tenders you can bid for, your sectors and regions, or your CV. Every score comes with the reasons, and the gaps.',
  },
  {
    q: 'Does it send anything on its own?',
    a: 'No. Leadline finds and drafts. Emails, bids and applications go out only when you send them.',
  },
  {
    q: 'I’m looking for a job. Is Leadline for me?',
    a: 'Yes. Choose “I’m looking for a job” when you sign up, upload your CV, and Leadline finds jobs that fit it, then writes a cover letter and a CV tailored to each one you approve.',
  },
  {
    q: 'Can my whole team use it?',
    a: 'Yes. Invite teammates as members or admins, and belong to more than one workspace with a single account.',
  },
  {
    q: 'Is my data shared with other organizations?',
    a: 'No. Each workspace’s profile, documents, finds and notes are private to its members.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-b border-border">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-6 py-20 lg:grid-cols-[1fr_1.6fr]">
        <div>
          <p className="text-sm font-semibold text-primary">Questions</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Good to know.
          </h2>
          <p className="mt-3 max-w-sm text-muted-foreground">
            Anything else? Sign up and look around: it’s free to start.
          </p>
        </div>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-card px-5 py-4 shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform group-open:rotate-45">
                  <Plus className="h-4 w-4" />
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
