import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Loader2, Search } from 'lucide-react';
import { useRunSettings, useStartSearch } from '~/features/runs';
import {
  runSettingsFormResolver,
  toRunSettingsForm,
  type RunSettingsForm,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppDialog, AppSheet } from '~/components/composed';
import { RunSettingsFields } from './settings/run-settings-fields';

/**
 * "Search for opportunities": run with the org's search settings, or change
 * them for this run only, then open the live run. No saved search is involved;
 * those run from their own page.
 */
export function RunDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const { org } = useOrg();
  const path = useOrgPath();
  const navigate = useNavigate();
  const { data: settings } = useRunSettings(org.id);
  const search = useStartSearch(org.id);
  const [configuring, setConfiguring] = useState(false);
  const form = useForm<RunSettingsForm>({ resolver: runSettingsFormResolver });
  const busy = search.isPending;

  const close = () => {
    setConfiguring(false);
    onClose();
  };

  const start = async (overrides?: RunSettingsForm) => {
    try {
      const { run: started } = await search.mutateAsync(overrides);
      navigate(path(`/runs/${started.id}`));
    } catch (error) {
      toastUtils.error('Could not start the search', extractError(error));
    }
  };

  const configure = () => {
    // Start from what "Run with my settings" would do.
    if (settings) form.reset(toRunSettingsForm(settings));
    setConfiguring(true);
  };

  return (
    <>
      <AppDialog
        open={open && !configuring}
        onOpenChange={(next) => !next && close()}
        title="Search for opportunities"
        description="Use your search settings, or change them for this search only."
        footer={
          <>
            <Button
              variant="outline"
              onClick={configure}
              disabled={!settings || busy}
            >
              Configure this run
            </Button>
            <Button onClick={() => start()} disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Run with my settings
            </Button>
          </>
        }
      />
      <AppSheet
        open={open && configuring}
        onOpenChange={(next) => !next && close()}
        dismissible={false}
        title="Configure this search"
        description="These choices apply to this search only."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfiguring(false)}>
              Back
            </Button>
            <Button type="submit" form="run-config-form" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Start search
            </Button>
          </>
        }
      >
        <Form {...form}>
          <form
            method="post"
            id="run-config-form"
            className="space-y-4"
            onSubmit={form.handleSubmit((data) => start(data))}
          >
            {settings && (
              <RunSettingsFields
                control={form.control}
                depths={settings.depths}
              />
            )}
          </form>
        </Form>
      </AppSheet>
    </>
  );
}
