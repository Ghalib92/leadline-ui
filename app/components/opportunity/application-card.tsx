import { Fragment, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Pencil,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  downloadApplication,
  isApplicationBusy,
  useApplication,
  useEditApplication,
  useWriteApplication,
} from '~/features/leads';
import {
  applicationFormResolver,
  type ApplicationFormInput,
  type JobApplication,
  type Opportunity,
} from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { stepHref } from '~/lib/org/setup-steps';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { AppCard, AppDialog } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { Textarea } from '~/components/ui/textarea';
import { FormTextareaField } from '~/components/form-fields';
import { useConfirm } from '~/components/ui/confirm-dialog';
import { CopyButton } from './lead-actions';
import { WORKED_LEAD_STATUSES } from './pitch-card';

const messageBox =
  'whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed';

function Section({
  icon,
  title,
  actions,
  children,
}: Readonly<{
  icon: ReactNode;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground" aria-hidden>
            {icon}
          </span>
          {title}
        </h3>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      {children}
    </section>
  );
}

/** **bold** and *italic* inside a line of the CV. */
function Inline({ text }: Readonly<{ text: string }>) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
          return <em key={index}>{part.slice(1, -1)}</em>;
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}

/** The tailored CV's simple Markdown: "#" headings, "-" bullets, paragraphs. */
export function CvPreview({ markdown }: Readonly<{ markdown: string }>) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      const items = bullets;
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc space-y-0.5 pl-5">
          {items.map((item, index) => (
            <li key={index}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (/^[-*•]\s+/.test(line)) {
      bullets.push(line.replace(/^[-*•]\s+/, ''));
      continue;
    }
    flush();
    if (!line) continue;
    const key = `b-${blocks.length}`;
    if (heading?.[1].length === 1) {
      blocks.push(
        <p key={key} className="text-lg font-semibold">
          {heading[2]}
        </p>
      );
    } else if (heading?.[1].length === 2) {
      blocks.push(
        <p
          key={key}
          className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {heading[2]}
        </p>
      );
    } else if (heading) {
      blocks.push(
        <p key={key} className="font-medium">
          <Inline text={heading[2]} />
        </p>
      );
    } else {
      blocks.push(
        <p key={key}>
          <Inline text={line} />
        </p>
      );
    }
  }
  flush();
  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed">
      {blocks}
    </div>
  );
}

/** A cover letter and a CV tailored to an approved job, written from the job seeker's
 * own CV. They edit both and apply themselves; Leadline never applies. */
export function ApplicationCard({
  orgId,
  opp,
}: Readonly<{ orgId: string; opp: Opportunity }>) {
  const approved = WORKED_LEAD_STATUSES.includes(opp.status);
  const { data: application, isPending } = useApplication(
    orgId,
    opp.id,
    approved
  );
  const write = useWriteApplication(orgId, opp.id);
  const path = useOrgPath();
  const [editing, setEditing] = useState(false);
  const [rewriting, setRewriting] = useState(false);

  const start = (instructions = '') =>
    write.mutate(instructions, {
      onSuccess: () => setRewriting(false),
      onError: (error) =>
        toastUtils.error(
          'Could not write the application',
          extractError(error)
        ),
    });

  if (!approved) {
    return (
      <AppCard title="Application">
        <p className="text-sm text-muted-foreground">
          Approve this job and Leadline writes a cover letter and a CV tailored
          to it, from your own CV, and tells you how to handle what your CV
          doesn’t show.
        </p>
      </AppCard>
    );
  }

  let body: ReactNode;
  if (isPending) {
    body = <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  } else if (!application) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">No application yet.</p>
        <Button size="sm" onClick={() => start()} disabled={write.isPending}>
          <Sparkles className="h-4 w-4" /> Write cover letter and CV
        </Button>
      </div>
    );
  } else if (isApplicationBusy(application)) {
    body = (
      <p className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Writing your cover letter and CV from your CV…
      </p>
    );
  } else if (application.status === 'failed' && !application.coverLetter) {
    const needsCv = application.error.startsWith('Upload your CV');
    body = (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{application.error}</p>
        <div className="flex flex-wrap gap-2">
          {needsCv && (
            <Button asChild size="sm" variant="outline">
              <Link to={path(stepHref('cv'))}>Upload your CV</Link>
            </Button>
          )}
          <Button size="sm" onClick={() => start()} disabled={write.isPending}>
            <Sparkles className="h-4 w-4" /> Try again
          </Button>
        </div>
      </div>
    );
  } else if (editing) {
    body = (
      <ApplicationEditor
        orgId={orgId}
        oppId={opp.id}
        application={application}
        onDone={() => setEditing(false)}
      />
    );
  } else {
    body = (
      <ApplicationView orgId={orgId} oppId={opp.id} application={application} />
    );
  }

  const ready = application && !isApplicationBusy(application) && !editing;
  return (
    <AppCard
      title="Application"
      actions={
        ready && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRewriting(true)}
            >
              <Sparkles className="h-4 w-4" /> Rewrite
            </Button>
          </div>
        )
      }
    >
      {body}
      <RewriteDialog
        open={rewriting}
        edited={!!application?.editedBy}
        pending={write.isPending}
        onClose={() => setRewriting(false)}
        onRewrite={start}
      />
    </AppCard>
  );
}

function ApplicationView({
  orgId,
  oppId,
  application,
}: Readonly<{ orgId: string; oppId: string; application: JobApplication }>) {
  const [downloading, setDownloading] = useState<'docx' | 'pdf' | null>(null);
  // Two files, so each can be attached on its own; an empty part is skipped.
  const parts = [
    ...(application.cv.trim() ? (['cv'] as const) : []),
    ...(application.coverLetter.trim() ? (['letter'] as const) : []),
  ];
  const what =
    parts.length === 2
      ? 'CV and cover letter'
      : parts[0] === 'cv'
        ? 'CV'
        : 'cover letter';
  const download = (format: 'docx' | 'pdf') => {
    setDownloading(format);
    downloadApplication(orgId, oppId, format, parts)
      .catch((error) =>
        toastUtils.error('Download failed', extractError(error))
      )
      .finally(() => setDownloading(null));
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {application.applyUrl && (
          <Button asChild size="sm">
            <a
              href={application.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply on their site <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        {parts.length > 0 && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => download('pdf')}
              disabled={!!downloading}
              title={`Your ${what}, ${parts.length === 2 ? 'as two PDF files' : 'as a PDF'}`}
            >
              {downloading === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}{' '}
              Download PDF{parts.length === 2 ? 's' : ''}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => download('docx')}
              disabled={!!downloading}
              title={`Your ${what}, ${parts.length === 2 ? 'as two Word files' : 'as a Word file'}`}
            >
              {downloading === 'docx' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}{' '}
              Word, to edit
            </Button>
          </>
        )}
      </div>
      {parts.length === 2 && (
        <p className="-mt-4 text-xs text-muted-foreground">
          Your CV and cover letter download as two files, ready to attach
          separately.
        </p>
      )}

      {application.unverified.length > 0 && (
        <Section
          icon={<ShieldAlert className="h-4 w-4" />}
          title="Check these lines: your CV doesn’t say this"
        >
          <ul className="space-y-1.5 text-sm">
            {application.unverified.map((line) => (
              <li
                key={line}
                className="rounded-md border-l-2 border-rose-500 bg-rose-500/5 px-3 py-1.5"
              >
                {line}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Change or remove each one unless it’s true. An interviewer will ask.
          </p>
        </Section>
      )}

      {application.gaps.length > 0 && (
        <Section
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Before you apply"
        >
          <ul className="space-y-1.5 text-sm">
            {application.gaps.map((gap) => (
              <li key={gap} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {gap}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        icon={<Mail className="h-4 w-4" />}
        title="Cover letter"
        actions={<CopyButton text={application.coverLetter} />}
      >
        <p className={messageBox}>{application.coverLetter}</p>
      </Section>

      <Section
        icon={<FileText className="h-4 w-4" />}
        title="Your CV, tailored to this job"
        actions={<CopyButton text={application.cv} />}
      >
        <CvPreview markdown={application.cv} />
      </Section>

      <p className="text-xs text-muted-foreground">
        {application.editedBy
          ? `Edited by ${application.editedBy.name} ${timeAgo(application.editedAt ?? application.updatedAt)}`
          : `Written by AI ${timeAgo(application.updatedAt)}`}
        {application.cvDocumentTitle &&
          ` from “${application.cvDocumentTitle}”`}
        . Only facts from your CV are used: check every line before you apply.
        Leadline never applies for you.
      </p>
    </div>
  );
}

function ApplicationEditor({
  orgId,
  oppId,
  application,
  onDone,
}: Readonly<{
  orgId: string;
  oppId: string;
  application: JobApplication;
  onDone: () => void;
}>) {
  const edit = useEditApplication(orgId, oppId);
  const form = useForm<ApplicationFormInput>({
    resolver: applicationFormResolver,
    defaultValues: {
      coverLetter: application.coverLetter,
      cv: application.cv,
    },
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((input) =>
          edit.mutate(input, {
            onSuccess: () => {
              toastUtils.success('Application saved');
              onDone();
            },
            onError: (error) =>
              toastUtils.error('Could not save', extractError(error)),
          })
        )}
      >
        <FormTextareaField
          control={form.control}
          name="coverLetter"
          label="Cover letter"
          rows={12}
        />
        <FormTextareaField
          control={form.control}
          name="cv"
          label="CV (# headings, - bullets, **bold**)"
          rows={16}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={edit.isPending}>
            Save
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

function RewriteDialog({
  open,
  edited,
  pending,
  onClose,
  onRewrite,
}: Readonly<{
  open: boolean;
  edited: boolean;
  pending: boolean;
  onClose: () => void;
  onRewrite: (instructions: string) => void;
}>) {
  const [instructions, setInstructions] = useState('');
  const { confirm, confirmDialog } = useConfirm();
  const submit = async () => {
    if (edited) {
      const ok = await confirm({
        title: 'Replace your edits?',
        description:
          'The AI writes a new letter and CV; your changes are not kept.',
        confirmLabel: 'Rewrite',
      });
      if (!ok) return;
    }
    onRewrite(instructions);
  };
  return (
    <>
      <AppDialog
        open={open}
        onOpenChange={(next) => !next && onClose()}
        title="Rewrite the application"
        description="Say what to change, or leave it empty for a fresh take."
        footer={
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending}>
              <Sparkles className="h-4 w-4" /> Rewrite
            </Button>
          </>
        }
      >
        <Textarea
          aria-label="What to change"
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Shorter letter. Lead with my M-Pesa integration work. Mention I can start in January."
        />
      </AppDialog>
      {confirmDialog}
    </>
  );
}
