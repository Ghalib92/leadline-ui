import { useMemo } from 'react';
import { Link } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Star } from 'lucide-react';
import {
  OPPORTUNITY_STATUSES,
  type Opportunity,
  type UpdateOpportunityInput,
} from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { Picker } from '~/components/ui/picker';
import { cn } from '~/lib/utils';
import { formatDate } from '~/lib/utils/format';
import { DeadlineBadge, MatchScore, StatusBadge, TypeBadge } from './badges';

const STATUS_ITEMS = OPPORTUNITY_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

interface Options {
  onUpdate: (opp: Opportunity, input: UpdateOpportunityInput) => void;
  canTriage: boolean;
}

export function useOpportunityColumns({
  onUpdate,
  canTriage,
}: Options): ColumnDef<Opportunity>[] {
  const path = useOrgPath();

  return useMemo<ColumnDef<Opportunity>[]>(
    () => [
      {
        id: 'saved',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            disabled={!canTriage}
            aria-label={
              row.original.saved
                ? `Unsave ${row.original.title}`
                : `Save ${row.original.title}`
            }
            aria-pressed={row.original.saved}
            onClick={() =>
              onUpdate(row.original, { saved: !row.original.saved })
            }
            className="rounded p-1 text-muted-foreground hover:text-amber-500 disabled:opacity-50"
          >
            <Star
              className={cn(
                'h-4 w-4',
                row.original.saved && 'fill-amber-400 text-amber-500'
              )}
            />
          </button>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Opportunity',
        cell: ({ row }) => (
          <div className="min-w-[16rem] max-w-md">
            <Link
              to={path(`/opportunities/${row.original.id}`)}
              className="line-clamp-1 font-medium hover:underline"
            >
              {row.original.title}
            </Link>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.latestReview === null && (
                <span className="mr-1 font-medium text-sky-700 dark:text-sky-300">
                  To review ·
                </span>
              )}
              {row.original.latestReview?.decision === 'approve' && (
                <span className="mr-1 font-medium text-emerald-700 dark:text-emerald-400">
                  Approved ·
                </span>
              )}
              {row.original.latestReview?.decision === 'reject' && (
                <span className="mr-1 font-medium text-destructive">
                  Rejected ·
                </span>
              )}
              {row.original.business
                ? [row.original.business.category, row.original.business.city]
                    .filter(Boolean)
                    .join(', ')
                : row.original.funder}{' '}
              · found by {row.original.agentName ?? 'a deleted worker'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
      },
      {
        accessorKey: 'matchScore',
        header: 'Match',
        cell: ({ row }) => <MatchScore score={row.original.matchScore} />,
      },
      {
        accessorKey: 'foundAt',
        header: 'Date found',
        cell: ({ row }) => (
          <span className="text-sm whitespace-nowrap text-muted-foreground">
            {formatDate(row.original.foundAt)}
          </span>
        ),
      },
      {
        accessorKey: 'deadline',
        header: 'Deadline',
        cell: ({ row }) => (
          <DeadlineBadge
            deadline={row.original.deadline}
            type={row.original.type}
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) =>
          canTriage ? (
            <Picker
              items={STATUS_ITEMS}
              value={row.original.status}
              onChange={(value) =>
                value &&
                onUpdate(row.original, {
                  status: value as Opportunity['status'],
                })
              }
              size="sm"
              searchable={false}
              clearable={false}
              className="w-32 shrink-0"
            />
          ) : (
            <StatusBadge status={row.original.status} />
          ),
      },
    ],
    [path, onUpdate, canTriage]
  );
}
