import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Check, Loader2, ThumbsDown } from 'lucide-react';
import {
  useRejectionReasons,
  useReviewHistory,
  useReviewOpportunity,
} from '~/features/reviews';
import {
  rejectFormResolver,
  type Opportunity,
  type RejectFormInput,
} from '~/lib/schema';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';
import { AppCard, AppDialog } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormPickerField, FormTextareaField } from '~/components/form-fields';

const REVIEWABLE = ['new', 'reviewing', 'pursuing', 'dismissed'];

/** Approve (starts the Proposal Writer) or reject with a reason the agents learn from. */
export function ReviewActions({
  orgId,
  opp,
}: Readonly<{ orgId: string; opp: Opportunity }>) {
  const review = useReviewOpportunity(orgId);
  const { data: reasons = [] } = useRejectionReasons(orgId);
  const [rejecting, setRejecting] = useState(false);
  const form = useForm<RejectFormInput>({
    resolver: rejectFormResolver,
    defaultValues: { reason: '', comment: '' },
  });

  if (!REVIEWABLE.includes(opp.status)) return null;
  const latest = opp.latestReview;

  const approve = () =>
    review.mutate(
      { id: opp.id, input: { decision: 'approve' } },
      {
        onSuccess: () =>
          toastUtils.success(
            'Approved',
            'The Proposal Writer has started a first draft.'
          ),
        onError: (error) =>
          toastUtils.error('Could not approve', extractError(error)),
      }
    );

  const reject = (input: RejectFormInput) =>
    review.mutate(
      { id: opp.id, input: { decision: 'reject', ...input } },
      {
        onSuccess: () => {
          setRejecting(false);
          form.reset();
          toastUtils.success('Rejected', 'Your reason will guide the agents.');
        },
        onError: (error) =>
          toastUtils.error('Could not reject', extractError(error)),
      }
    );

  return (
    <>
      <Button
        onClick={approve}
        disabled={review.isPending || latest?.decision === 'approve'}
        className="bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {review.isPending && !rejecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        {latest?.decision === 'approve' ? 'Approved' : 'Approve'}
      </Button>
      <Button
        variant="outline"
        onClick={() => setRejecting(true)}
        disabled={review.isPending}
      >
        <ThumbsDown className="h-4 w-4" />
        {latest?.decision === 'reject' ? 'Change reason' : 'Reject'}
      </Button>

      <AppDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title="Reject this opportunity"
        description="Your reason is saved and used to tune future searches."
        footer={
          <>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="reject-form"
              variant="destructive"
              disabled={review.isPending}
            >
              {review.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            id="reject-form"
            onSubmit={form.handleSubmit(reject)}
            className="space-y-4"
          >
            <FormPickerField
              control={form.control}
              name="reason"
              label="Reason"
              options={reasons}
              searchable={false}
              required
            />
            <FormTextareaField
              control={form.control}
              name="comment"
              label="Comment"
              rows={3}
              placeholder="e.g. Only open to organizations registered in the EU"
              required
            />
          </form>
        </Form>
      </AppDialog>
    </>
  );
}

export function LatestReview({ opp }: Readonly<{ opp: Opportunity }>) {
  const latest = opp.latestReview;
  if (latest === undefined) return null;
  if (latest === null) {
    return (
      <p className="mt-2 inline-flex rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
        Awaiting review
      </p>
    );
  }
  const approved = latest.decision === 'approve';
  return (
    <p
      className={cn(
        'mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        approved
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : 'bg-destructive/10 text-destructive'
      )}
    >
      {approved ? 'Approved' : 'Rejected'}
      {latest.reviewerName ? ` by ${latest.reviewerName}` : ''} ·{' '}
      {timeAgo(latest.createdAt)}
    </p>
  );
}

export function ReviewHistory({
  orgId,
  oppId,
}: Readonly<{ orgId: string; oppId: string }>) {
  const { data: history = [] } = useReviewHistory(orgId, oppId);
  const { data: reasons = [] } = useRejectionReasons(orgId);
  if (history.length === 0) return null;
  const label = (value: string) =>
    reasons.find((reason) => reason.value === value)?.label ?? value;
  return (
    <AppCard title="Decisions">
      <ol className="space-y-3 text-sm">
        {history.map((item) => (
          <li key={item.id}>
            <p>
              <span
                className={cn(
                  'font-medium',
                  item.decision === 'approve'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-destructive'
                )}
              >
                {item.decision === 'approve' ? 'Approved' : 'Rejected'}
              </span>
              {item.reason && ` · ${label(item.reason)}`}
              <span className="text-muted-foreground">
                {' '}
                · {item.reviewerName ?? 'Someone'} · {timeAgo(item.createdAt)}
              </span>
            </p>
            {item.comment && (
              <p className="mt-0.5 text-muted-foreground">{item.comment}</p>
            )}
          </li>
        ))}
      </ol>
    </AppCard>
  );
}
