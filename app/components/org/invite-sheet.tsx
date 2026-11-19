import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { inviteMembersResolver, type InviteMembersInput } from '~/lib/schema';
import { useInviteMembers } from '~/features/members';
import { useOrg } from '~/lib/org/org-context';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppSheet } from '~/components/composed';
import { FormPickerField, FormTagInputField } from '~/components/form-fields';
import { EMAIL_SEPARATORS } from '~/components/ui/tag-input';

const ROLE_OPTIONS = [
  {
    value: 'member',
    label: 'Member',
    description: 'Reviews and triages opportunities',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Also manages members and integrations',
  },
];

export function InviteSheet({
  open,
  onOpenChange,
}: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void }>) {
  const { org } = useOrg();
  const invite = useInviteMembers(org.id);
  const form = useForm<InviteMembersInput>({
    resolver: inviteMembersResolver,
    defaultValues: { emails: [], role: 'member' },
  });

  useEffect(() => {
    if (open) form.reset({ emails: [], role: 'member' });
  }, [open, form]);

  const onSubmit = async (data: InviteMembersInput) => {
    try {
      const { created, skipped } = await invite.mutateAsync(data);
      if (created.length > 0) {
        toastUtils.success(
          `Invited ${created.length} ${created.length === 1 ? 'person' : 'people'}`
        );
      }
      if (skipped.length > 0) {
        toastUtils.info(
          'Skipped',
          `${skipped.join(', ')} already joined or already has an invite.`
        );
      }
      onOpenChange(false);
    } catch (error) {
      toastUtils.error('Could not send invites', extractError(error));
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      dismissible={false}
      title={`Invite people to ${org.name}`}
      description="They’ll get a link to join. Invites expire after 7 days."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="invite-form" disabled={invite.isPending}>
            Send invites
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id="invite-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormTagInputField
            control={form.control}
            name="emails"
            label="Email addresses"
            placeholder="name@company.com — add several with commas or spaces"
            separators={EMAIL_SEPARATORS}
            maxTags={20}
            required
          />
          <FormPickerField
            control={form.control}
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
            searchable={false}
            clearable={false}
          />
        </form>
      </Form>
    </AppSheet>
  );
}
