import { INTEGRATIONS } from '~/data';

export function IntegrationsStrip() {
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="container mx-auto px-6 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Sends matches to the tools you already use
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {INTEGRATIONS.map((i) => (
            <li key={i.id} className="text-lg font-semibold text-foreground/70">
              {i.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
