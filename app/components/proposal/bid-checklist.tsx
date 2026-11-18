import { Link } from 'react-router';
import { FileText, Loader2, RefreshCw, Upload } from 'lucide-react';
import {
  useRecheckDocuments,
  useTickChecklistItem,
} from '~/features/proposals';
import type { ChecklistItem, ChecklistStatus, Proposal } from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { cn } from '~/lib/utils';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { AppCard } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';

export const STATUS: Record<
  ChecklistStatus,
  { label: string; hint: string; className: string }
> = {
  ready: {
    label: 'Covered',
    hint: 'One of your documents covers it',
    className:
      'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
  },
  check: {
    label: 'Check',
    hint: 'A document may cover it: confirm it (dates, kind)',
    className:
      'bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300',
  },
  missing: {
    label: 'Missing',
    hint: 'None of your documents covers it',
    className:
      'bg-rose-500/10 text-rose-700 ring-rose-500/30 dark:text-rose-300',
  },
  prepare: {
    label: 'Prepare',
    hint: 'Made for this bid: forms, declarations, bid security',
    className: 'bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:text-sky-300',
  },
};

function StatusBadge({ status }: Readonly<{ status: ChecklistStatus }>) {
  const style = STATUS[status];
  return (
    <span
      title={style.hint}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        style.className
      )}
    >
      {style.label}
    </span>
  );
}

/** A tender's mandatory requirements against the organization's documents: what is
 * covered, what to check, what is missing and what to prepare. People tick an item
 * once it is in hand for this bid. */
export function BidChecklist({
  orgId,
  oppId,
  proposal,
  busy,
}: Readonly<{
  orgId: string;
  oppId: string;
  proposal: Proposal;
  busy: boolean;
}>) {
  const path = useOrgPath();
  const tick = useTickChecklistItem(orgId, oppId);
  const recheck = useRecheckDocuments(orgId, oppId);
  const items = proposal.checklist;
  const inHand = items.filter((item) => item.done).length;
  const counts = (Object.keys(STATUS) as ChecklistStatus[])
    .map((status) => ({
      status,
      count: items.filter((item) => item.status === status && !item.done)
        .length,
    }))
    .filter(({ count }) => count > 0);
  const rechecking =
    recheck.isPending || (busy && proposal.job?.kind === 'checklist');

  return (
    <AppCard
      title="Compliance checklist"
      description={
        <>
          {inHand} of {items.length} in hand
          {proposal.checkedAt && ` · checked ${timeAgo(proposal.checkedAt)}`}
        </>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to={path('/settings/general?tab=documents')}>
              <Upload className="h-4 w-4" /> Upload documents
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || recheck.isPending}
            onClick={() =>
              recheck.mutate(proposal, {
                onError: (error) =>
                  toastUtils.error('Could not recheck', extractError(error)),
              })
            }
          >
            {rechecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recheck documents
          </Button>
        </div>
      }
    >
      {counts.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {counts.map(({ status, count }) => (
            <span key={status} className="inline-flex items-center gap-1">
              <StatusBadge status={status} />
              <span className="tabular-nums text-muted-foreground">
                {count}
              </span>
            </span>
          ))}
        </div>
      )}
      <ol className="divide-y divide-border">
        {items.map((item) => (
          <ChecklistRow
            key={item.key}
            item={item}
            disabled={tick.isPending}
            onTick={(done) =>
              tick.mutate(
                { proposal, key: item.key, done },
                {
                  onError: (error) =>
                    toastUtils.error('Could not save', extractError(error)),
                }
              )
            }
          />
        ))}
      </ol>
      <p className="mt-3 text-xs text-muted-foreground">
        Checked by AI from your documents&apos; titles and text. Confirm each
        item against the tender document before you submit.
      </p>
    </AppCard>
  );
}

function ChecklistRow({
  item,
  disabled,
  onTick,
}: Readonly<{
  item: ChecklistItem;
  disabled: boolean;
  onTick: (done: boolean) => void;
}>) {
  const id = `checklist-${item.key}`;
  return (
    <li className="flex gap-3 py-2.5">
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={item.done}
        disabled={disabled}
        onCheckedChange={(checked) => onTick(checked === true)}
        aria-label={`In hand: ${item.requirement}`}
      />
      <div className="min-w-0 flex-1 text-sm">
        <div className="flex items-start justify-between gap-2">
          <label
            htmlFor={id}
            className={cn(
              'cursor-pointer',
              item.done && 'text-muted-foreground line-through'
            )}
          >
            {item.code && (
              <span className="mr-1.5 font-mono text-xs text-muted-foreground">
                {item.code}
              </span>
            )}
            {item.requirement}
          </label>
          {item.done ? (
            <span className="shrink-0 text-xs text-emerald-700 dark:text-emerald-300">
              In hand
            </span>
          ) : (
            <StatusBadge status={item.status} />
          )}
        </div>
        {item.documents.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {item.documents.map((doc) => (
              <li
                key={doc.id}
                className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs"
              >
                <FileText className="h-3 w-3" /> {doc.title}
              </li>
            ))}
          </ul>
        )}
        {item.note && !item.done && (
          <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
        )}
      </div>
    </li>
  );
}
