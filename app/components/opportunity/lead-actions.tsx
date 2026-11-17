import { useState } from 'react';
import { Check, Copy, Mail, MessageCircle, Phone } from 'lucide-react';
import {
  CLOSED_OUTCOMES,
  leadOutcomes,
  mailtoLink,
  whatsappLink,
  type LeadOutcome,
} from '~/lib/schema';
import { labelOf } from '~/data/taxonomy';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';

/** Copies `text`; says so for two seconds. */
export function CopyButton({
  text,
  label = 'Copy',
}: Readonly<{ text: string; label?: string }>) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!text}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toastUtils.error('Could not copy', 'Select the text and copy it.');
        }
      }}
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : label}
    </Button>
  );
}

/** Opens WhatsApp with the message filled in; the person presses send. */
export function WhatsAppButton({
  number,
  message,
  size = 'sm',
}: Readonly<{ number: string; message?: string; size?: 'sm' | 'default' }>) {
  const href = whatsappLink(number, message);
  if (!href) return null;
  return (
    <Button asChild size={size}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
    </Button>
  );
}

/** Opens the person's email app with the pitch filled in. */
export function EmailButton({
  email,
  subject,
  body,
  size = 'sm',
}: Readonly<{
  email: string;
  subject?: string;
  body?: string;
  size?: 'sm' | 'default';
}>) {
  const href = mailtoLink(email, subject, body);
  if (!href) return null;
  return (
    <Button asChild size={size} variant="outline">
      <a href={href}>
        <Mail className="h-4 w-4" /> Email
      </a>
    </Button>
  );
}

export function CallButton({
  phone,
  size = 'sm',
}: Readonly<{ phone: string; size?: 'sm' | 'default' }>) {
  if (!phone) return null;
  return (
    <Button asChild size={size} variant="outline">
      <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
        <Phone className="h-4 w-4" /> {phone}
      </a>
    </Button>
  );
}

const GOOD: readonly LeadOutcome[] = ['interested', 'meeting'];

export function OutcomeBadge({ outcome }: Readonly<{ outcome: LeadOutcome }>) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        GOOD.includes(outcome)
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : CLOSED_OUTCOMES.includes(outcome)
            ? 'bg-muted text-muted-foreground'
            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
      )}
    >
      {labelOf(leadOutcomes, outcome)}
    </span>
  );
}
