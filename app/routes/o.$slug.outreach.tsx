import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { isAxiosError } from 'axios';
import {
  AlertTriangle,
  Loader2,
  Mail,
  RotateCcw,
  Send,
  Trash2,
} from 'lucide-react';
import {
  useApproveEmail,
  useDiscardEmail,
  useEditEmail,
  useOutreachEmails,
  useRedraftEmail,
} from '~/features/outreach';
import {
  emailEditFormResolver,
  type EmailEditFormInput,
  type EmailStatus,
  type OutreachEmail,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';
import { AppDialog } from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField, FormTextareaField } from '~/components/form-fields';
import { useConfirm } from '~/components/ui/confirm-dialog';
import { EmailStatusBadge } from '~/components/opportunity/email-status';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Funder emails | Leadline',
    description: 'Review and approve emails to funders before they are sent.',
    url: '/app',
    noIndex: true,
  });
}

const TABS: { key: string; label: string; statuses: EmailStatus[] }[] = [
  {
    key: 'queue',
    label: 'To approve',
    statuses: ['drafting', 'draft', 'failed', 'sending'],
  },
  { key: 'sent', label: 'Sent', statuses: ['sent'] },
  { key: 'discarded', label: 'Discarded', statuses: ['discarded'] },
];

export default function OutreachPage() {
  const { org, role } = useOrg();
  const path = useOrgPath();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.find((t) => t.key === searchParams.get('tab')) ?? TABS[0];
  const { data: emails = [], isPending } = useOutreachEmails(org.id, {
    status: tab.statuses,
  });
  const openId = searchParams.get('email');
  const isAdmin = role !== 'member';

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  return (
    <Page>
      <PageHeader
        title="Funder emails"
        description={
          isAdmin
            ? 'Emails to funders. Nothing is sent until you approve it; replies come to you.'
            : 'Emails to funders. An admin approves each one before it is sent.'
        }
      />

      <div
        role="tablist"
        className="mb-4 flex gap-1 rounded-full bg-muted p-0.5 sm:w-fit"
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tab.key}
            onClick={() => setParam('tab', t.key === 'queue' ? null : t.key)}
            className={cn(
              'flex-1 rounded-full px-4 py-1.5 text-sm transition-colors sm:flex-none',
              t.key === tab.key
                ? 'bg-background font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <PageLoader className="min-h-[20vh]" />
      ) : emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No emails yet"
          description="Write to a funder’s contact from an approved opportunity."
        />
      ) : (
        <ul className="space-y-3">
          {emails.map((email) => (
            <li key={email.id}>
              <button
                type="button"
                onClick={() => setParam('email', email.id)}
                className="w-full rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {email.status === 'drafting'
                        ? 'The AI is drafting…'
                        : email.subject || '(no subject)'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      To{' '}
                      {email.toName
                        ? `${email.toName} <${email.toEmail}>`
                        : email.toEmail}{' '}
                      · {email.opportunity.title}
                    </p>
                  </div>
                  <EmailStatusBadge status={email.status} />
                </div>
                {email.body && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {email.body}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {email.sentAt
                    ? `Sent ${timeAgo(email.sentAt)} · approved by ${email.approvedBy?.name ?? 'an admin'}`
                    : `Updated ${timeAgo(email.updatedAt)}${email.createdBy ? ` · by ${email.createdBy.name}` : ''}`}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <EmailDialog
        orgId={org.id}
        email={emails.find((e) => e.id === openId) ?? null}
        isAdmin={isAdmin}
        opportunityPath={(id) => path(`/opportunities/${id}`)}
        onClose={() => setParam('email', null)}
      />
    </Page>
  );
}

function EmailDialog({
  orgId,
  email,
  isAdmin,
  opportunityPath,
  onClose,
}: Readonly<{
  orgId: string;
  email: OutreachEmail | null;
  isAdmin: boolean;
  opportunityPath: (id: string) => string;
  onClose: () => void;
}>) {
  const edit = useEditEmail(orgId);
  const redraft = useRedraftEmail(orgId);
  const discard = useDiscardEmail(orgId);
  const approve = useApproveEmail(orgId);
  const { confirm, confirmDialog } = useConfirm();
  const [instructions, setInstructions] = useState('');
  const form = useForm<EmailEditFormInput>({
    resolver: emailEditFormResolver,
    defaultValues: { subject: '', body: '' },
  });
  const emailId = email?.id;
  const subject = email?.subject ?? '';
  const body = email?.body ?? '';
  useEffect(() => {
    form.reset({ subject, body });
  }, [form, emailId, subject, body]);

  if (!email) return null;
  const editable = email.status === 'draft' || email.status === 'failed';
  const hasTodo = /\[TODO/i.test(form.watch('body') + form.watch('subject'));

  const saveThen = async (input: EmailEditFormInput) => {
    if (input.subject !== email.subject || input.body !== email.body) {
      await edit.mutateAsync({ id: email.id, ...input });
    }
  };

  const onSave = form.handleSubmit((input) =>
    saveThen(input)
      .then(() => toastUtils.success('Draft saved'))
      .catch((error) => toastUtils.error('Could not save', extractError(error)))
  );

  const send = async (confirmRepeat = false): Promise<void> => {
    try {
      await approve.mutateAsync({ id: email.id, confirmRepeat });
      toastUtils.success('Sent', `To ${email.toEmail}. Replies come to you.`);
      onClose();
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.data?.code : null;
      if (code === 'recently_emailed') {
        const ok = await confirm({
          title: 'Emailed recently',
          description: extractError(error),
          confirmLabel: 'Send anyway',
        });
        if (ok) return send(true);
        return;
      }
      toastUtils.error('Not sent', extractError(error));
    }
  };

  const onSend = form.handleSubmit(async (input) => {
    try {
      await saveThen(input);
    } catch (error) {
      toastUtils.error('Could not save', extractError(error));
      return;
    }
    const ok = await confirm({
      title: `Send to ${email.toEmail}?`,
      description:
        'It is sent from Leadline on behalf of your organization, exactly as shown. Replies and a copy go to you.',
      confirmLabel: 'Send email',
    });
    if (ok) await send();
  });

  return (
    <AppDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={email.toName ? `To ${email.toName}` : `To ${email.toEmail}`}
      description={
        <>
          {email.toEmail} · about{' '}
          <Link
            to={opportunityPath(email.opportunity.id)}
            className="text-primary underline"
          >
            {email.opportunity.title}
          </Link>
        </>
      }
      footer={
        editable ? (
          <>
            <Button
              variant="ghost"
              onClick={() =>
                discard.mutate(email.id, {
                  onSuccess: onClose,
                  onError: (error) =>
                    toastUtils.error('Could not discard', extractError(error)),
                })
              }
            >
              <Trash2 className="h-4 w-4" /> Discard
            </Button>
            <Button
              variant="outline"
              onClick={onSave}
              disabled={edit.isPending}
            >
              Save draft
            </Button>
            {isAdmin && (
              <Button
                onClick={onSend}
                disabled={approve.isPending || hasTodo}
                title={hasTodo ? 'Fill in the [TODO] parts first' : undefined}
              >
                {approve.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Approve & send
              </Button>
            )}
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <EmailStatusBadge status={email.status} />
          {!isAdmin && editable && (
            <span className="text-xs text-muted-foreground">
              Waiting for an admin to approve
            </span>
          )}
        </div>
        {email.error && (
          <p className="flex gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {email.error}
          </p>
        )}
        {email.status === 'drafting' ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> The AI is writing this
            email…
          </p>
        ) : (
          <Form {...form}>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <fieldset disabled={!editable} className="space-y-3">
                <FormTextField
                  control={form.control}
                  name="subject"
                  label="Subject"
                />
                <FormTextareaField
                  control={form.control}
                  name="body"
                  label="Message"
                  rows={12}
                />
              </fieldset>
            </form>
          </Form>
        )}
        {hasTodo && editable && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Fill in the [TODO] parts before sending.
          </p>
        )}
        {editable && (
          <div className="flex gap-2">
            <input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ask the AI to change it, e.g. “shorter and more formal”"
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
              aria-label="Instructions for the AI"
              maxLength={2000}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              disabled={redraft.isPending}
              onClick={() =>
                redraft.mutate(
                  { id: email.id, instructions },
                  {
                    onSuccess: () => setInstructions(''),
                    onError: (error) =>
                      toastUtils.error(
                        'Could not redraft',
                        extractError(error)
                      ),
                  }
                )
              }
            >
              <RotateCcw className="h-4 w-4" /> Redraft
            </Button>
          </div>
        )}
      </div>
      {confirmDialog}
    </AppDialog>
  );
}
