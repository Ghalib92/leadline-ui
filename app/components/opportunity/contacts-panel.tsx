import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import {
  BadgeCheck,
  Ban,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  useAddContact,
  useContactSearch,
  useContacts,
  useDeleteContact,
  useDraftEmail,
  useFindContacts,
  useOutreachEmails,
  useOutreachPurposes,
  useUpdateContact,
} from '~/features/outreach';
import {
  contactFormResolver,
  emailDraftFormResolver,
  type Contact,
  type ContactFormInput,
  type EmailDraftFormInput,
  type Opportunity,
} from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';
import { AppCard, AppDialog } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import {
  FormPickerField,
  FormTextField,
  FormTextareaField,
} from '~/components/form-fields';
import { useConfirm } from '~/components/ui/confirm-dialog';
import { EmailStatusBadge } from './email-status';

const APPROVED = ['pursuing', 'submitted'];
const SOURCE_LABEL = { page: 'Found on', hunter: 'Hunter.io', manual: 'Added' };

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Funder contacts for an approved opportunity, and emails to them. */
export function ContactsPanel({
  orgId,
  opp,
}: Readonly<{ orgId: string; opp: Opportunity }>) {
  const path = useOrgPath();
  const { data: contacts = [], isPending } = useContacts(orgId, opp.id);
  const { data: search } = useContactSearch(orgId, opp.id);
  const find = useFindContacts(orgId, opp.id);
  const { data: emails = [] } = useOutreachEmails(orgId, {
    opportunity: opp.id,
  });
  const [adding, setAdding] = useState(false);
  const [writingTo, setWritingTo] = useState<Contact | null>(null);

  if (!APPROVED.includes(opp.status)) return null;
  const searching = search?.status === 'queued' || search?.status === 'running';

  return (
    <AppCard
      title="Contacts & outreach"
      description="People to ask about this call. Nothing is sent until an admin approves it."
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
          <Button
            size="sm"
            onClick={() =>
              find.mutate(undefined, {
                onError: (error) =>
                  toastUtils.error('Could not search', extractError(error)),
              })
            }
            disabled={searching || find.isPending}
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find contacts
          </Button>
        </div>
      }
    >
      {searching && (
        <p className="mb-3 flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          The lead scout is reading the call and the funder’s contact pages…
        </p>
      )}
      {search && !searching && search.finishedAt && (
        <p className="mb-3 text-xs text-muted-foreground">
          {search.status === 'failed'
            ? search.error
            : `Last search ${timeAgo(search.finishedAt)}: ${search.found} new contact${search.found === 1 ? '' : 's'}.`}
          {search.warning && ` ${search.warning}`}
        </p>
      )}

      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : contacts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No contacts yet. Let the lead scout look, or add one you know.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {contacts.map((contact) => (
            <ContactRow
              key={contact.id}
              orgId={orgId}
              oppId={opp.id}
              contact={contact}
              onWrite={() => setWritingTo(contact)}
            />
          ))}
        </ul>
      )}

      {emails.length > 0 && (
        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Emails</p>
            <Link
              to={path('/outreach')}
              className="text-xs text-primary hover:underline"
            >
              Open outreach queue
            </Link>
          </div>
          <ul className="space-y-1.5">
            {emails.map((email) => (
              <li
                key={email.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <Link
                  to={path(`/outreach?email=${email.id}`)}
                  className="min-w-0 truncate hover:underline"
                >
                  {email.subject || '(drafting…)'}{' '}
                  <span className="text-muted-foreground">
                    → {email.toName || email.toEmail}
                  </span>
                </Link>
                <EmailStatusBadge status={email.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <AddContactDialog
        orgId={orgId}
        oppId={opp.id}
        open={adding}
        onOpenChange={setAdding}
      />
      <WriteEmailDialog
        orgId={orgId}
        oppId={opp.id}
        contact={writingTo}
        onClose={() => setWritingTo(null)}
      />
    </AppCard>
  );
}

function ContactRow({
  orgId,
  oppId,
  contact,
  onWrite,
}: Readonly<{
  orgId: string;
  oppId: string;
  contact: Contact;
  onWrite: () => void;
}>) {
  const update = useUpdateContact(orgId, oppId);
  const remove = useDeleteContact(orgId, oppId);
  const { confirm, confirmDialog } = useConfirm();

  const onDelete = async () => {
    const ok = await confirm({
      title: `Delete ${contact.name || contact.email}?`,
      description:
        'Their details are removed. Unsent drafts to them are discarded.',
      confirmLabel: 'Delete contact',
      destructive: true,
    });
    if (ok) remove.mutate(contact.id);
  };

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          {contact.name ||
            (contact.kind === 'inbox' ? 'Team inbox' : 'Unnamed')}
          {contact.role && (
            <span className="font-normal text-muted-foreground">
              · {contact.role}
            </span>
          )}
          {contact.verified && (
            <BadgeCheck
              className="h-4 w-4 text-emerald-600"
              aria-label="Email verified"
            />
          )}
          {contact.doNotContact && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] text-destructive">
              Do not contact
            </span>
          )}
        </p>
        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {contact.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" /> {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {contact.phone}
            </span>
          )}
          <span>
            {SOURCE_LABEL[contact.source]}{' '}
            {contact.sourceUrl && (
              <a
                href={contact.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline"
              >
                {hostOf(contact.sourceUrl)}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </span>
        </p>
        {contact.relevance && (
          <p className="mt-1 text-xs">{contact.relevance}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span
          className={cn(
            'mr-1 text-xs tabular-nums',
            contact.confidence >= 70
              ? 'text-emerald-600'
              : 'text-muted-foreground'
          )}
          title="How likely this is the right person"
        >
          {contact.confidence}%
        </span>
        <Button size="sm" onClick={onWrite} disabled={!contact.canEmail}>
          <Mail className="h-4 w-4" /> Email
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label={
            contact.doNotContact ? 'Allow contact' : 'Mark do not contact'
          }
          title={contact.doNotContact ? 'Allow contact' : 'Do not contact'}
          onClick={() =>
            update.mutate({
              id: contact.id,
              input: { do_not_contact: !contact.doNotContact },
            })
          }
        >
          <Ban className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Delete contact"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {confirmDialog}
    </li>
  );
}

function AddContactDialog({
  orgId,
  oppId,
  open,
  onOpenChange,
}: Readonly<{
  orgId: string;
  oppId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const add = useAddContact(orgId, oppId);
  const form = useForm<ContactFormInput>({
    resolver: contactFormResolver,
    defaultValues: { name: '', role: '', email: '', phone: '' },
  });
  const submit = (input: ContactFormInput) =>
    add.mutate(input, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
      onError: (error) =>
        toastUtils.error('Could not add contact', extractError(error)),
    });
  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add a contact"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="contact-form" disabled={add.isPending}>
            Add contact
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="contact-form"
          onSubmit={form.handleSubmit(submit)}
          className="space-y-3"
        >
          <FormTextField control={form.control} name="name" label="Name" />
          <FormTextField control={form.control} name="role" label="Role" />
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
          />
          <FormTextField control={form.control} name="phone" label="Phone" />
        </form>
      </Form>
    </AppDialog>
  );
}

function WriteEmailDialog({
  orgId,
  oppId,
  contact,
  onClose,
}: Readonly<{
  orgId: string;
  oppId: string;
  contact: Contact | null;
  onClose: () => void;
}>) {
  const path = useOrgPath();
  const { data: purposes = [] } = useOutreachPurposes(orgId);
  const draft = useDraftEmail(orgId, oppId);
  const form = useForm<EmailDraftFormInput>({
    resolver: emailDraftFormResolver,
    defaultValues: { purpose: 'question', instructions: '' },
  });
  const submit = (input: EmailDraftFormInput) =>
    contact &&
    draft.mutate(
      { contact: contact.id, ...input },
      {
        onSuccess: () => {
          form.reset();
          onClose();
          toastUtils.success(
            'Drafting your email',
            'It appears in the outreach queue for review in a few seconds.'
          );
        },
        onError: (error) =>
          toastUtils.error('Could not start the email', extractError(error)),
      }
    );
  return (
    <AppDialog
      open={!!contact}
      onOpenChange={(open) => !open && onClose()}
      title={`Email ${contact?.name || contact?.email || ''}`}
      description={
        <>
          The AI writes a draft from your profile. You can edit it in the{' '}
          <Link to={path('/outreach')} className="text-primary underline">
            outreach queue
          </Link>
          ; an admin approves before it is sent.
        </>
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="email-form" disabled={draft.isPending}>
            {draft.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Draft with AI
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="email-form"
          onSubmit={form.handleSubmit(submit)}
          className="space-y-3"
        >
          <FormPickerField
            control={form.control}
            name="purpose"
            label="What is it for?"
            options={purposes}
            searchable={false}
            clearable={false}
          />
          <FormTextareaField
            control={form.control}
            name="instructions"
            label="Anything to say or ask (optional)"
            rows={3}
            placeholder="e.g. Ask whether a consortium with a Ugandan partner can apply"
          />
        </form>
      </Form>
    </AppDialog>
  );
}
