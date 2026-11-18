import { Link } from 'react-router';
import { FileText, Loader2, Sparkles } from 'lucide-react';
import {
  isProposalBusy,
  useOpportunityProposal,
  useStartProposal,
} from '~/features/proposals';
import type { Opportunity } from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { AppCard } from '~/components/composed';
import { Button } from '~/components/ui/button';

const APPROVED = ['pursuing', 'submitted'];

/** Where the opportunity's proposal stands, with a way in. */
export function ProposalCard({
  orgId,
  opp,
}: Readonly<{ orgId: string; opp: Opportunity }>) {
  const path = useOrgPath();
  const { data: proposal, isPending } = useOpportunityProposal(orgId, opp.id);
  const start = useStartProposal(orgId, opp.id);
  const editor = path(`/opportunities/${opp.id}/proposal`);
  const approved = APPROVED.includes(opp.status);
  const bid = opp.type === 'tender';
  const title = bid ? 'Bid' : 'Proposal';

  if (!approved && !proposal) {
    return (
      <AppCard title={title}>
        <p className="text-sm text-muted-foreground">
          {bid
            ? 'Approve this tender and the bid writer reads its documents, checks your documents against its requirements, plans to the deadline and drafts the technical proposal.'
            : 'Approve this opportunity and the Proposal Writer drafts a full proposal from your profile and documents.'}
        </p>
      </AppCard>
    );
  }
  const open = proposal?.checklist.filter((item) => !item.done) ?? [];
  const missing = open.filter((item) => item.status === 'missing').length;

  return (
    <AppCard
      title={title}
      actions={
        proposal && (
          <Button asChild size="sm">
            <Link to={editor}>
              <FileText className="h-4 w-4" /> Open
            </Link>
          </Button>
        )
      }
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !proposal ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No draft yet.</p>
          <Button
            size="sm"
            onClick={() =>
              start.mutate(undefined, {
                onError: (error) =>
                  toastUtils.error('Could not start', extractError(error)),
              })
            }
            disabled={start.isPending}
          >
            <Sparkles className="h-4 w-4" /> Write {bid ? 'bid' : 'proposal'}
          </Button>
        </div>
      ) : isProposalBusy(proposal) ? (
        <p className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          {bid ? 'The bid writer' : 'The Proposal Writer'} is drafting…{' '}
          <Link to={editor} className="text-primary hover:underline">
            Watch
          </Link>
        </p>
      ) : (
        <div className="space-y-1 text-sm">
          <p>
            Version {proposal.version} · {proposal.sections.length} sections
            {proposal.draftedAt && ` · ${timeAgo(proposal.draftedAt)}`}
          </p>
          {proposal.review && (
            <p className="text-muted-foreground">
              Readiness{' '}
              <span className="font-semibold text-foreground">
                {proposal.review.score}/100
              </span>
              {proposal.review.issues.length > 0 &&
                ` · ${proposal.review.issues.length} things to fix`}
            </p>
          )}
          {proposal.checklist.length > 0 && (
            <p className="text-muted-foreground">
              Checklist{' '}
              <span className="font-semibold text-foreground">
                {proposal.checklist.length - open.length}/
                {proposal.checklist.length}
              </span>{' '}
              in hand
              {missing > 0 && (
                <span className="text-rose-600 dark:text-rose-400">
                  {' '}
                  · {missing} missing
                </span>
              )}
            </p>
          )}
          {proposal.status === 'failed' && proposal.error && (
            <p className="text-destructive">{proposal.error}</p>
          )}
        </div>
      )}
    </AppCard>
  );
}
