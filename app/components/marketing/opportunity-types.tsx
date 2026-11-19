import {
  BriefcaseBusiness,
  Check,
  Coins,
  FileText,
  Handshake,
  Store,
  X,
} from 'lucide-react';
import { cn } from '~/lib/utils';

/** A small tile for the icon, in the same hue as that type's badge in the app. */
function Icon({
  icon: Glyph,
  tone,
}: Readonly<{ icon: typeof Store; tone: string }>) {
  return (
    <span
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl',
        tone
      )}
    >
      <Glyph className="h-5 w-5" />
    </span>
  );
}

function Card({
  className,
  children,
}: Readonly<{ className?: string; children: React.ReactNode }>) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}

export function OpportunityTypes() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-border">
      <div className="container mx-auto px-6 py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">What it finds</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything worth going after, in one place.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each worker looks for one kind of opportunity. Run as many as you
            need.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-6">
          {/* Clients: the biggest card, with the reasons a business needs you. */}
          <Card className="lg:col-span-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Icon icon={Store} tone="bg-sky-500/10 text-sky-700" />
                <h3 className="mt-4 text-xl font-semibold">Clients</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  Businesses in your towns that need what you sell: who they
                  are, why they need you, how to reach them, and a pitch ready
                  to send.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 rounded-xl bg-muted/60 p-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Seaside hotel, Mombasa</p>
                <p className="text-xs text-muted-foreground">
                  Website checked today
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" /> Secure, works
                    on phones
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-rose-600" /> No online booking
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="h-4 w-4 text-rose-600" /> No M-Pesa payments
                  </li>
                </ul>
              </div>
              <div className="rounded-lg bg-card p-3 text-sm shadow-sm">
                <p className="text-xs font-semibold text-primary">
                  Suggested pitch
                </p>
                <p className="mt-1 leading-snug text-foreground/80">
                  A booking site with M-Pesa checkout, so guests can book and
                  pay at 2 a.m. without calling.
                </p>
              </div>
            </div>
          </Card>

          {/* Tenders */}
          <Card className="lg:col-span-2">
            <Icon icon={FileText} tone="bg-indigo-500/10 text-indigo-700" />
            <h3 className="mt-4 text-xl font-semibold">Tenders</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Open tenders from tenders.go.ke and beyond, checked against your
              documents, then a bid drafted section by section.
            </p>
            <div className="mt-auto space-y-2 pt-6 text-sm">
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span>Tax compliance certificate</span>
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span>3 similar projects</span>
                <Check className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </Card>

          {/* Jobs */}
          <Card className="lg:col-span-2">
            <Icon
              icon={BriefcaseBusiness}
              tone="bg-teal-500/10 text-teal-700"
            />
            <h3 className="mt-4 text-xl font-semibold">Jobs</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Jobs on company career pages and Kenyan job boards, scored against
              your CV, with a cover letter and a tailored CV.
            </p>
            <div className="mt-auto flex items-center justify-between rounded-lg bg-sidebar px-3 py-2.5 text-sm text-sidebar-foreground">
              <span>Fits your CV</span>
              <span className="rounded-md bg-gold px-2 py-0.5 text-xs font-bold text-sidebar">
                86%
              </span>
            </div>
          </Card>

          {/* Grants */}
          <Card className="lg:col-span-2">
            <Icon icon={Coins} tone="bg-emerald-500/10 text-emerald-700" />
            <h3 className="mt-4 text-xl font-semibold">Grants and funding</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Calls for proposals from funders, development banks and grant
              databases, matched to your sectors and regions.
            </p>
          </Card>

          {/* Partnerships */}
          <Card className="lg:col-span-2">
            <Icon icon={Handshake} tone="bg-violet-500/10 text-violet-700" />
            <h3 className="mt-4 text-xl font-semibold">Partnerships</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Consortium calls and programmes looking for local partners, so you
              can bid on work bigger than your team.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
