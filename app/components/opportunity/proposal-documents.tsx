import { useEffect, useEffectEvent, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import {
  proposalKnowledgeResolver,
  type Proposal,
  type ProposalKnowledgeForm,
} from '~/lib/schema';
import { useSetProposalKnowledge } from '~/features/proposals';
import { useFolders } from '~/features/orgs';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { AppCard, AppSheet } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormPickerField } from '~/components/form-fields';

const modeOptions = [
  {
    value: 'run',
    label: 'Same as the search',
    description: 'The documents the search that found this could read.',
  },
  { value: 'all', label: 'All documents', description: 'Every folder.' },
  {
    value: 'selected',
    label: 'Only selected folders',
    description: 'For example your past proposals and audits.',
  },
  {
    value: 'none',
    label: 'No documents',
    description: 'Write from the profile only; claims will need checking.',
  },
];

function describe(knowledge: Proposal['knowledge']) {
  const what =
    knowledge.mode === 'all'
      ? 'All documents'
      : knowledge.mode === 'none'
        ? 'No documents'
        : knowledge.folders.map((f) => f.name).join(', ') || 'No folders';
  return knowledge.source === 'run' ? `${what} (same as the search)` : what;
}

/** Which company documents the Proposal Writer takes evidence from; edits in a sheet. */
export function ProposalDocuments({
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
  const [open, setOpen] = useState(false);
  const save = useSetProposalKnowledge(orgId, oppId);
  const { data: folders = [] } = useFolders(orgId);

  const defaults = (): ProposalKnowledgeForm => ({
    mode:
      proposal.knowledge.source === 'run'
        ? 'run'
        : proposal.knowledge.mode === 'folders'
          ? 'selected'
          : proposal.knowledge.mode,
    folders: proposal.knowledge.folders.map((f) => f.id),
  });
  const form = useForm<ProposalKnowledgeForm>({
    resolver: proposalKnowledgeResolver,
    defaultValues: defaults(),
  });
  const mode = useWatch({ control: form.control, name: 'mode' });

  const onOpened = useEffectEvent(() => form.reset(defaults()));
  useEffect(() => {
    if (open) onOpened();
  }, [open]);

  const onSubmit = async (values: ProposalKnowledgeForm) => {
    try {
      await save.mutateAsync({ proposal, form: values });
      toastUtils.success(
        'Documents saved',
        'The next draft or section rewrite will use them.'
      );
      setOpen(false);
    } catch (error) {
      toastUtils.error('Could not save', extractError(error));
    }
  };

  return (
    <>
      <AppCard
        title="Company documents"
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(true)}
            disabled={busy}
            aria-label="Edit company documents"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        }
        contentClassName="text-sm"
      >
        <p>{describe(proposal.knowledge)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Where the writer finds evidence for each section.
        </p>
      </AppCard>

      <AppSheet
        open={open}
        onOpenChange={setOpen}
        dismissible={!form.formState.isDirty}
        title="Company documents"
        description="Which documents the Proposal Writer may cite. Applies to the next draft or section rewrite."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="proposal-documents"
              disabled={save.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            id="proposal-documents"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormPickerField
              control={form.control}
              name="mode"
              label="Use"
              options={modeOptions}
              searchable={false}
              clearable={false}
            />
            {mode === 'selected' && (
              <FormPickerField
                control={form.control}
                name="folders"
                label="Folders"
                placeholder={folders.length ? 'Pick folders' : 'No folders yet'}
                options={folders.map((f) => ({
                  value: f.id,
                  label: f.name,
                  description: f.purpose || undefined,
                }))}
                multi
                optionStyle="checkbox"
                displayMode="inline"
                required
              />
            )}
          </form>
        </Form>
      </AppSheet>
    </>
  );
}
