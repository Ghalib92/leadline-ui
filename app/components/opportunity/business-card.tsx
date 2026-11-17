import type { ReactNode } from 'react';
import {
  Check,
  ExternalLink,
  Globe,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  X,
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

type Site = NonNullable<OpportunityBusiness['site']>;

/** Where the lead lookup found a field, shown next to it. Directory facts get none. */
function FoundOn({ where }: Readonly<{ where?: string }>) {
  if (!where) return null;
  return (
    <span className="text-xs text-muted-foreground">
      {where === 'website' ? 'from their website' : `found in a ${where}`}
    </span>
  );
}

const hostOf = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

function WebsiteValue({
  business,
}: Readonly<{ business: OpportunityBusiness }>) {
  const { website, websiteStatus, site, sourceLabel } = business;
  if (website) {
    return (
      <span className="flex flex-col">
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className={link}
        >
          {hostOf(website)}
        </a>
        {websiteStatus === 'down' && site?.problem && (
          <span className="font-medium text-rose-600 dark:text-rose-400">
            Down: {site.problem}
          </span>
        )}
        <FoundOn where={business.foundOn.website} />
      </span>
    );
  }
  if (websiteStatus === 'none') {
    return (
      <span className="font-medium text-rose-600 dark:text-rose-400">
        No website
      </span>
    );
  }
  if (websiteStatus === 'not_found') {
    return (
      <span className="font-medium text-rose-600 dark:text-rose-400">
        None found on {sourceLabel} or in a web search
      </span>
    );
  }
  return (
    <span className="text-muted-foreground">
      Not listed on {sourceLabel}; it may still have one
    </span>
  );
}

/** The checks run on its website, each a pass or a miss. */
function siteChecks(site: Site): { label: string; ok: boolean }[] {
  const checks: { label: string; ok: boolean | undefined }[] = [
    {
      label: site.certificateError ? 'Certificate invalid' : 'Secure (HTTPS)',
      ok: site.certificateError ? false : site.https,
    },
    { label: 'Set up for phones', ok: site.mobileReady },
    {
      label:
        site.mobileSpeed === undefined
          ? 'Speed on phones'
          : `Speed on phones ${site.mobileSpeed}/100`,
      ok: site.mobileSpeed === undefined ? undefined : site.mobileSpeed >= 50,
    },
    {
      label: site.copyrightYear ? `© ${site.copyrightYear}` : 'Copyright year',
      ok: site.copyrightYear
        ? new Date().getFullYear() - site.copyrightYear < 3
        : undefined,
    },
    { label: 'Online booking', ok: site.booking },
    { label: 'Chat', ok: site.chat },
    { label: 'Online payments', ok: site.payments },
  ];
  return checks.filter(
    (check): check is { label: string; ok: boolean } => check.ok !== undefined
  );
}

function SiteCheckRow({ site }: Readonly<{ site: Site }>) {
  if (!site.reachable) return null; // said in the website row and the evidence
  if (site.blocked) {
    return (
      <Row icon={<ShieldCheck className="h-4 w-4" />} label="Website check">
        <span className="text-muted-foreground">
          The site doesn&apos;t allow automated checks
        </span>
      </Row>
    );
  }
  const checks = siteChecks(site);
  if (checks.length === 0) return null;
  return (
    <Row icon={<ShieldCheck className="h-4 w-4" />} label="Website check">
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((check) => (
          <li key={check.label} className="inline-flex items-center gap-1">
            {check.ok ? (
              <Check
                className="h-3.5 w-3.5 text-emerald-600"
                aria-label="yes"
              />
            ) : (
              <X className="h-3.5 w-3.5 text-rose-600" aria-label="no" />
            )}
            {check.label}
          </li>
        ))}
      </ul>
      {site.checkedAt && (
        <span className="text-xs text-muted-foreground">
          Checked {site.checkedAt}
        </span>
      )}
    </Row>
  );
}

/** A client lead: how to reach the business, why it needs you and the angle to
 * pitch it. Facts are the directory's or checked on its website by the lead
 * lookup (marked with where they were found); nothing here is guessed. */
export function BusinessCard({
  business,
  summary,
}: Readonly<{ business: OpportunityBusiness; summary: string }>) {
  const whatsapp = business.phone ? whatsappLink(business.phone) : null;
  const place = [business.address, business.city].filter(Boolean).join(', ');
  const socials = Object.entries(business.socials);
  const explained = new Set(business.evidence.map((item) => item.signal));
  const otherSignals = business.signals.filter(
    (signal) => !explained.has(signal)
  );

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
              <FoundOn where={business.foundOn.phone} />
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
            <span className="flex flex-wrap items-center gap-x-3">
              <a href={`mailto:${business.email}`} className={link}>
                {business.email}
              </a>
              <FoundOn where={business.foundOn.email} />
            </span>
          ) : (
            <span className="text-muted-foreground">Not listed</span>
          )}
        </Row>
        <Row icon={<Globe className="h-4 w-4" />} label="Website">
          <WebsiteValue business={business} />
        </Row>
        {business.site && <SiteCheckRow site={business.site} />}
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

      {(business.evidence.length > 0 || otherSignals.length > 0) && (
        <div>
          <p className="mb-2 font-medium">Why they need you</p>
          {business.evidence.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {business.evidence.map((item) => (
                <li key={item.signal} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"
                    aria-hidden
                  />
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>
          )}
          {otherSignals.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {otherSignals.map((signal) => (
                <li
                  key={signal}
                  className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-700 dark:text-rose-400"
                >
                  {labelOf(leadSignals, signal)}
                </li>
              ))}
            </ul>
          )}
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
