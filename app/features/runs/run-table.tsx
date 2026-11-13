import { Link, useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import type { AgentRun } from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { formatDate, timeAgo } from '~/lib/utils/format';
import { Button } from '~/components/ui/button';
import { RunStatusBadge, formatDuration } from './badges';

interface RunTableProps {
  runs: AgentRun[];
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}

/** Runs with their status, timing and what they added; a row opens the run. */
export function RunTable({
  runs,
  page,
  totalPages,
  total,
  onPage,
}: Readonly<RunTableProps>) {
  const path = useOrgPath();
  const navigate = useNavigate();
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 font-medium">Search</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Date of run</th>
              <th className="px-4 py-2.5 font-medium">Duration</th>
              <th className="px-4 py-2.5 text-right font-medium">Read</th>
              <th className="px-4 py-2.5 text-right font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.map((run) => (
              <tr
                key={run.id}
                onClick={() => navigate(path(`/runs/${run.id}`))}
                className="cursor-pointer hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <Link
                    to={path(`/runs/${run.id}`)}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium hover:underline"
                  >
                    {run.agentName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {run.trigger === 'manual' ? 'Manual' : 'Scheduled'}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <RunStatusBadge status={run.status} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">
                    {formatDate(run.startedAt)}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(run.startedAt)}
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {formatDuration(run.durationMs)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {run.pagesRead}
                </td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">
                  {run.found > 0 ? (
                    <Link
                      to={path(`/opportunities?run=${run.id}`)}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      title="View opportunities found by this run"
                    >
                      {run.found}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    run.found
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages} · {total} runs
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}
