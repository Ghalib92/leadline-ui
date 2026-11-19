import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { generateSEOTags } from '~/lib/utils/seo';
import { AppTabs } from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { ProfileTab } from '~/components/org/settings/profile-tabs';
import { LinksTab } from '~/components/org/settings/links-tab';
import { SourcesTab } from '~/components/org/settings/sources-tab';
import { DocumentsTab } from '~/components/org/settings/documents-tab';
import { RunSettingsTab } from '~/components/org/settings/run-settings-tab';
import { DossierTab } from '~/components/org/settings/dossier-tab';
import { DangerZone } from '~/components/org/settings/danger-zone';
import { Page } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Profile & documents | Leadline',
    description: 'Your profile, documents and what Leadline looks for.',
    url: '/app',
    noIndex: true,
  });
}

/**
 * Organization profile, the AI's summary of it, links, documents
 * and access. Tabs live in `?tab=`; the open edit sheet in `?edit=`
 * so the setup checklist can deep-link.
 */
export default function GeneralSettingsPage() {
  const { view } = useOrg();
  const path = useOrgPath();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'profile';
  const editing = searchParams.get('edit');

  useEffect(() => {
    if (tab === 'preferences') {
      navigate(path('/agents?tab=preferences'), { replace: true });
    }
  }, [tab, navigate, path]);

  const update = (next: { tab?: string; edit?: string | null }) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next.tab !== undefined) {
          if (next.tab === 'profile') params.delete('tab');
          else params.set('tab', next.tab);
          params.delete('edit');
        }
        if (next.edit === null) params.delete('edit');
        else if (next.edit) params.set('edit', next.edit);
        return params;
      },
      { replace: true }
    );
  const setEditing = (edit: string | null) => update({ edit });
  const props = { editing, setEditing };

  return (
    <Page width="narrow">
      <PageHeader
        title="Profile & documents"
        description="Who you are and what you have. Leadline uses it to find and rank matches."
      />
      <AppTabs
        variant="underline"
        value={tab}
        onValueChange={(value) => update({ tab: value })}
        tabs={[
          {
            value: 'profile',
            label: 'Profile',
            content: <ProfileTab {...props} />,
          },
          {
            value: 'ai',
            label: 'AI summary',
            content: <DossierTab goToTab={(value) => update({ tab: value })} />,
          },
          { value: 'links', label: 'Links', content: <LinksTab {...props} /> },
          {
            value: 'sources',
            label: 'Sources',
            content: <SourcesTab {...props} />,
          },
          {
            value: 'documents',
            label: 'Documents',
            content: <DocumentsTab {...props} />,
          },
          {
            value: 'runs',
            label: 'Search settings',
            content: <RunSettingsTab />,
          },
          { value: 'access', label: 'Access', content: <DangerZone /> },
        ]}
      />
      {view.myRole !== 'admin' && (
        <p className="mt-4 text-sm text-muted-foreground">
          Only admins can edit these settings.
        </p>
      )}
    </Page>
  );
}
