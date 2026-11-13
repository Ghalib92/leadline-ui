import { Award, Coins, FileText, Handshake } from 'lucide-react';

const TYPES = [
  {
    icon: Coins,
    title: 'Grants & funding',
    body: 'Donor grants, calls for proposals, accelerator and investor programmes.',
  },
  {
    icon: FileText,
    title: 'Tenders & RFPs',
    body: 'Government and corporate procurement, consultancies and EOIs.',
  },
  {
    icon: Handshake,
    title: 'Partnerships',
    body: 'Consortium calls, fellowships and programmes seeking local partners.',
  },
  {
    icon: Award,
    title: 'Events & awards',
    body: 'Conferences, pitch competitions and prizes worth showing up for.',
  },
];

export function OpportunityTypes() {
  return (
    <section className="container mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold tracking-tight">
        Everything worth going after
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        One feed for the four kinds of opportunity African organizations chase
        most.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TYPES.map((t) => (
          <div key={t.title} className="rounded-xl border border-border p-6">
            <t.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-semibold">{t.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
