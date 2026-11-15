import type { ReactNode } from 'react';
import {
  ExternalLink,
  Globe,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from 'lucide-react';
import { leadSignals } from '~/data/org-taxonomy';
import { labelOf } from '~/data/taxonomy';
import type { OpportunityBusiness } from '~/lib/schema';
import { AppCard } from '~/components/composed';

const socialLabel: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
  twitter: 'X',
  linktree: 'Link page',
  whatsapp: 'WhatsApp',
};

/** wa.me wants the number in international form, digits only. */
const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 ? `https://wa.me/${digits}` : null;
};

function Row({
  icon,
  label,
  children,
}: Readonly<{ icon: ReactNode; label: string; children: ReactNode }>) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="break-words">{children}</dd>
      </div>
    </div>
  );
}

const link = 'text-primary hover:underline';

/** A client lead: how to reach the business, what its listing shows and the
 * angle to pitch it. Facts are the directory's; nothing here is guessed. */
export function BusinessCard({
  business,
  summary,
}: Readonly<{ business: OpportunityBusiness; summary: string }>) {
  const whatsapp = business.phone ? whatsappLink(business.phone) : null;
  const place = [business.address, business.city].filter(Boolean).join(', ');
  const socials = Object.entries(business.socials);

  return (
    <AppCard title="Business" contentClassName="space-y-5 text-sm">
      <p className="leading-relaxed">{summary}</p>

      {business.pitchAngle && (
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Suggested pitch</p>
            <p className="text-muted-foreground">{business.pitchAngle}</p>
          </div>
        </div>
      )}

      <dl className="grid gap-4 sm:grid-cols-2">
        <Row icon={<Phone className="h-4 w-4" />} label="Phone">
          {business.phone ? (
            <span className="flex flex-wrap items-center gap-x-3">
              <a href={`tel:${business.phone}`} className={link}>
                {business.phone}
              </a>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link} inline-flex items-center gap-1`}
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Not listed</span>
          )}
        </Row>
        <Row icon={<Mail className="h-4 w-4" />} label="Email">
          {business.email ? (
            <a href={`mailto:${business.email}`} className={link}>
              {business.email}
            </a>
          ) : (
            <span className="text-muted-foreground">Not listed</span>
          )}
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Website">
          {business.website ? (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className={link}
            >
              {business.website.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          ) : business.completeListing ? (
            <span className="font-medium text-rose-600 dark:text-rose-400">
              No website
            </span>
          ) : (
            <span className="text-muted-foreground">
              Not listed on {business.sourceLabel}; it may still have one
            </span>
          )}
        </Row>
        <Row icon={<MapPin className="h-4 w-4" />} label="Address">
          {place || <span className="text-muted-foreground">Not listed</span>}
        </Row>
        {business.rating !== undefined && (
          <Row icon={<Star className="h-4 w-4" />} label="Rating">
            {business.rating.toFixed(1)}
            {business.reviews !== undefined &&
              ` from ${business.reviews.toLocaleString('en')} reviews`}
          </Row>
        )}
        {socials.length > 0 && (
          <Row icon={<ExternalLink className="h-4 w-4" />} label="Social">
            <span className="flex flex-wrap gap-x-3">
              {socials.map(([kind, url]) => (
                <a
                  key={kind}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={link}
                >
                  {socialLabel[kind] ?? kind}
                </a>
              ))}
            </span>
          </Row>
        )}
      </dl>

      {business.signals.length > 0 && (
        <div>
          <p className="mb-2 font-medium">Signs they need you</p>
          <ul className="flex flex-wrap gap-2">
            {business.signals.map((signal) => (
              <li
                key={signal}
                className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-700 dark:text-rose-400"
              >
                {labelOf(leadSignals, signal)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Listed on{' '}
        <a
          href={business.listingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          {business.sourceLabel}
        </a>
        {business.source === 'osm_places' && ' · © OpenStreetMap contributors'}
      </p>
    </AppCard>
  );
}
