import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  FileText,
  Globe,
  Mail,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import type { Opportunity } from '~/lib/schema';
import { cn } from '~/lib/utils';
import { AppCard } from '~/components/composed';

type Tender = NonNullable<Opportunity['tender']>;

const link = 'text-primary hover:underline';

function Fact({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{children}</dd>
    </div>
  );
}

/** "Closes Wed 26 Nov, 10:00 · in 9 days"; red when under 3 days, gone when past. */
function Closing({
  closesAt,
  now = new Date(),
}: Readonly<{ closesAt: string; now?: Date }>) {
  const closes = new Date(closesAt);
  if (Number.isNaN(closes.getTime())) return null;
  const days = Math.floor((closes.getTime() - now.getTime()) / 86_400_000);
  const when = closes.toLocaleString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  });
  let left = `in ${days} days`;
  if (closes < now) left = 'closed';
  else if (days < 1) left = 'today';
  else if (days === 1) left = 'tomorrow';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        days < 3 ? 'text-rose-600 dark:text-rose-400' : ''
      )}
    >
      <CalendarClock className="h-4 w-4" /> Closes {when} · {left}
    </span>
  );
}

/** A tender's facts as its procurement portal publishes them: when it closes, what it
 * costs to bid, who it is reserved for, the documents and whom to ask. */
export function TenderCard({
  tender,
  now,
}: Readonly<{ tender: Tender; now?: Date }>) {
  const contact = tender.buyerContact;
  const hasContact =
    contact.email || contact.phone || contact.website || contact.address;
  return (
    <AppCard
      title="Tender"
      description={tender.reference || undefined}
      contentClassName="space-y-5 text-sm"
    >
      {tender.closesAt && <Closing closesAt={tender.closesAt} now={now} />}

      {tender.reservedFor.length > 0 && (
        <p className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            Reserved under AGPO for{' '}
            <strong>{tender.reservedFor.join(', ').toLowerCase()}</strong>
            -owned firms. Only bid if your AGPO certificate covers it.
          </span>
        </p>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        {tender.buyer && <Fact label="Buyer">{tender.buyer}</Fact>}
        {tender.category && <Fact label="Category">{tender.category}</Fact>}
        {tender.method && <Fact label="Method">{tender.method}</Fact>}
        {tender.submission.length > 0 && (
          <Fact label="How to submit">{tender.submission.join(', ')}</Fact>
        )}
        {tender.tenderFee !== undefined && (
          <Fact label="Tender fee">
            {tender.tenderFee === 0
              ? 'Free'
              : `${tender.tenderFee.toLocaleString('en')} KES`}
          </Fact>
        )}
        <Fact label="Bid security">
          {tender.bidSecurity || (
            <span className="text-muted-foreground">Not stated</span>
          )}
        </Fact>
        {tender.venue && <Fact label="Opening venue">{tender.venue}</Fact>}
        {tender.publishedAt && (
          <Fact label="Published">{tender.publishedAt}</Fact>
        )}
      </dl>

      {tender.documents.length > 0 && (
        <div>
          <p className="mb-2 font-medium">Documents</p>
          <ul className="space-y-1.5">
            {tender.documents.map((doc) => (
              <li key={doc.url}>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(link, 'inline-flex items-center gap-1.5')}
                >
                  <FileText className="h-4 w-4" /> {doc.name || 'Document'}
                </a>
              </li>
            ))}
          </ul>
          {tender.addenda > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {tender.addenda === 1
                ? '1 addendum issued'
                : `${tender.addenda} addenda issued`}
              : read them on the portal before bidding.
            </p>
          )}
        </div>
      )}

      {hasContact && (
        <div>
          <p className="mb-2 font-medium">Questions to the buyer</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
            {contact.email && (
              <li className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${contact.email}`} className={link}>
                  {contact.email}
                </a>
              </li>
            )}
            {contact.phone && (
              <li className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${contact.phone}`} className={link}>
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.website && (
              <li className="inline-flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={
                    contact.website.startsWith('http')
                      ? contact.website
                      : `https://${contact.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  {contact.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </li>
            )}
            {contact.address && (
              <li className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-4 w-4" /> {contact.address}
              </li>
            )}
          </ul>
        </div>
      )}

      {tender.source && (
        <p className="text-xs text-muted-foreground">
          From {tender.source}. The tender document is the authority; check it
          before bidding.
        </p>
      )}
    </AppCard>
  );
}
