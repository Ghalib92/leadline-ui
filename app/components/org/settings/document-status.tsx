import type { DocumentProcessingStatus } from '~/lib/schema';
import { cn } from '~/lib/utils';

const STATUS_META: Record<
  DocumentProcessingStatus,
  { label: string; hint: string; className: string; dot: string }
> = {
  pending: {
    label: 'Queued',
    hint: 'Waiting for the AI to read it',
    className: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/60',
  },
  processing: {
    label: 'Reading',
    hint: 'The AI is reading this document',
    className: 'bg-primary/10 text-primary',
    dot: 'bg-primary animate-pulse',
  },
  processed: {
    label: 'Read by AI',
    hint: 'Leadline can use this document',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  failed: {
    label: 'Failed',
    hint: 'The AI could not read this document',
    className: 'bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
  },
  unsupported: {
    label: 'Not readable',
    hint: 'The AI cannot read this kind of file yet',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
};

/** Where the AI is with a document: queued, reading, read, or why not. */
export function DocumentStatusBadge({
  status,
}: Readonly<{ status: DocumentProcessingStatus }>) {
  const meta = STATUS_META[status];
  return (
    <span
      title={meta.hint}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        meta.className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
