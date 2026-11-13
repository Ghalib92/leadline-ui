import type { EmailStatus } from '~/lib/schema';
import { cn } from '~/lib/utils';

const META: Record<EmailStatus, { label: string; className: string }> = {
  drafting: { label: 'AI drafting…', className: 'bg-primary/10 text-primary' },
  draft: {
    label: 'Awaiting approval',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  sending: { label: 'Sending…', className: 'bg-primary/10 text-primary' },
  sent: {
    label: 'Sent',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
  discarded: {
    label: 'Discarded',
    className: 'bg-muted text-muted-foreground',
  },
};

export function EmailStatusBadge({
  status,
}: Readonly<{ status: EmailStatus }>) {
  const meta = META[status];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}
