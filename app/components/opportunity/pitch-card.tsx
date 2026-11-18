import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import {
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
} from 'lucide-react';
import {
  isPitchBusy,
  useEditPitch,
  usePitch,
  useWritePitch,
} from '~/features/leads';
import {
  pitchFormResolver,
  type LeadPitch,
  type Opportunity,
  type PitchFormInput,
} from '~/lib/schema';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { AppCard, AppDialog } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { Textarea } from '~/components/ui/textarea';
import { FormTextField, FormTextareaField } from '~/components/form-fields';
import { useConfirm } from '~/components/ui/confirm-dialog';
import {
  CallButton,
  CopyButton,
  EmailButton,
  WhatsAppButton,
} from './lead-actions';

/** Statuses of a lead that was approved (pitches are for those). */
export const WORKED_LEAD_STATUSES = ['pursuing', 'submitted', 'won', 'lost'];

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

const messageBox =
  'whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm leading-relaxed';

/** What to say to an approved client lead, with buttons that open the person's own
 * WhatsApp, email and phone. Nothing is sent by Leadline. */
export function PitchCard({
  orgId,
  opp,
}: Readonly<{ orgId: string; opp: Opportunity }>) {
  const approved = WORKED_LEAD_STATUSES.includes(opp.status);
  const { data: pitch, isPending } = usePitch(orgId, opp.id, approved);
  const write = useWritePitch(orgId, opp.id);
  const [editing, setEditing] = useState(false);
  const [rewriting, setRewriting] = useState(false);

  const start = (instructions = '') =>
    write.mutate(instructions, {
      onSuccess: () => setRewriting(false),
      onError: (error) =>
        toastUtils.error('Could not write the pitch', extractError(error)),
    });

  if (!approved) {
    return (
      <AppCard title="Pitch">
        <p className="text-sm text-muted-foreground">
          Approve this lead and Leadline writes what to say: a WhatsApp message,
          an email and points for a call, from why they need you.
        </p>
      </AppCard>
    );
  }

  let body: ReactNode;
  if (isPending) {
    body = <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  } else if (!pitch) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">No pitch yet.</p>
        <Button size="sm" onClick={() => start()} disabled={write.isPending}>
          <Sparkles className="h-4 w-4" /> Write pitch
        </Button>
      </div>
    );
  } else if (isPitchBusy(pitch)) {
    body = (
      <p className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        {opp.business?.websiteStatus === 'unknown'
          ? 'Checking their website, then writing the pitch…'
          : 'Writing the pitch…'}
      </p>
    );
  } else if (pitch.status === 'failed' && !pitch.whatsapp) {
    body = (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{pitch.error}</p>
        <Button size="sm" onClick={() => start()} disabled={write.isPending}>
          <Sparkles className="h-4 w-4" /> Try again
        </Button>
      </div>
    );
  } else if (editing) {
    body = (
      <PitchEditor
        orgId={orgId}
        oppId={opp.id}
        pitch={pitch}
        onDone={() => setEditing(false)}
      />
    );
  } else {
    body = <PitchView pitch={pitch} opp={opp} />;
  }

  const ready = pitch && !isPitchBusy(pitch) && !editing;
  return (
    <AppCard
      title="Pitch"
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
        edited={!!pitch?.editedBy}
        pending={write.isPending}
        onClose={() => setRewriting(false)}
        onRewrite={start}
      />
    </AppCard>
  );
}

function PitchView({
  pitch,
  opp,
}: Readonly<{ pitch: LeadPitch; opp: Opportunity }>) {
  const business = opp.business;
  const email = `Subject: ${pitch.emailSubject}\n\n${pitch.emailBody}`;
  return (
    <div className="space-y-6">
      <Section
        icon={<MessageCircle className="h-4 w-4" />}
        title="WhatsApp message"
        actions={
          <>
            <CopyButton text={pitch.whatsapp} />
            <WhatsAppButton
              number={pitch.whatsappNumber}
              message={pitch.whatsapp}
            />
          </>
        }
      >
        <p className={messageBox}>{pitch.whatsapp}</p>
        {!pitch.whatsappNumber && (
          <p className="text-xs text-muted-foreground">
            No WhatsApp number we can be sure of: copy the message instead.
          </p>
        )}
      </Section>

      <Section
        icon={<Mail className="h-4 w-4" />}
        title="Email"
        actions={
          <>
            <CopyButton text={email} />
            {business?.email && (
              <EmailButton
                email={business.email}
                subject={pitch.emailSubject}
                body={pitch.emailBody}
              />
            )}
          </>
        }
      >
        <div className={messageBox}>
          <p className="mb-2 font-medium">{pitch.emailSubject}</p>
          {pitch.emailBody}
        </div>
      </Section>

      {pitch.callPoints.length > 0 && (
        <Section
          icon={<Phone className="h-4 w-4" />}
          title="On a call"
          actions={business?.phone && <CallButton phone={business.phone} />}
        >
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {pitch.callPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </Section>
      )}

      <p className="text-xs text-muted-foreground">
        {pitch.editedBy
          ? `Edited by ${pitch.editedBy.name} ${timeAgo(pitch.editedAt ?? pitch.updatedAt)}`
          : `Written by AI ${timeAgo(pitch.updatedAt)}`}
        .
        {[pitch.whatsapp, pitch.emailBody].some((text) =>
          text.includes('[Your name]')
        ) && ' Fill in [Your name] before sending.'}{' '}
        Nothing is sent by Leadline.
      </p>
    </div>
  );
}

function PitchEditor({
  orgId,
  oppId,
  pitch,
  onDone,
}: Readonly<{
  orgId: string;
  oppId: string;
  pitch: LeadPitch;
  onDone: () => void;
}>) {
  const edit = useEditPitch(orgId, oppId);
  const form = useForm<PitchFormInput>({
    resolver: pitchFormResolver,
    defaultValues: {
      whatsapp: pitch.whatsapp,
      emailSubject: pitch.emailSubject,
      emailBody: pitch.emailBody,
      callPoints: pitch.callPoints.join('\n'),
    },
  });
  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((input) =>
          edit.mutate(input, {
            onSuccess: () => {
              toastUtils.success('Pitch saved');
              onDone();
            },
            onError: (error) =>
              toastUtils.error('Could not save', extractError(error)),
          })
        )}
      >
        <FormTextareaField
          control={form.control}
          name="whatsapp"
          label="WhatsApp message"
          rows={5}
        />
        <FormTextField
          control={form.control}
          name="emailSubject"
          label="Email subject"
        />
        <FormTextareaField
          control={form.control}
          name="emailBody"
          label="Email"
          rows={8}
        />
        <FormTextareaField
          control={form.control}
          name="callPoints"
          label="Call points (one per line)"
          rows={4}
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
        description: 'The AI writes a new pitch; your changes are not kept.',
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
        title="Rewrite the pitch"
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
          placeholder="Shorter. Mention our M-Pesa payments integration. Write in Swahili."
        />
      </AppDialog>
      {confirmDialog}
    </>
  );
}
