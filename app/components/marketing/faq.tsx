const FAQS = [
  {
    q: 'Where do the agents look?',
    a: 'Public funder websites, grant databases, procurement portals and news. Sources are built in — there is nothing to set up before your first agent runs.',
  },
  {
    q: 'How are matches ranked?',
    a: 'Each result is scored against your sectors, regions, the opportunity types you want and your agent’s keywords. Every score comes with the reasons behind it.',
  },
  {
    q: 'Can my whole team use it?',
    a: 'Yes. Invite teammates as members or admins, and belong to more than one organization with a single account.',
  },
  {
    q: 'Is my data shared with other organizations?',
    a: 'No. Each organization’s agents, opportunities, notes and integrations are private to its members.',
  },
];

export function Faq() {
  return (
    <section className="container mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
      <div className="mt-8 divide-y divide-border rounded-xl border border-border">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
              {item.q}
              <span
                aria-hidden
                className="text-muted-foreground transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
