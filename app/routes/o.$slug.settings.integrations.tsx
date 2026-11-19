import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { INTEGRATIONS } from '~/data/integrations';
import type { Integration, IntegrationCategory } from '~/lib/schema';
import { generateSEOTags } from '~/lib/utils/seo';
import { cn } from '~/lib/utils';
import { Input } from '~/components/ui/input';
import { PageHeader } from '~/components/dashboard/page-header';
import { IntegrationLogo } from '~/components/org/integration-logo';
import { EmptyState, Page } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Connected apps | Leadline',
    description: 'Send matches and deadlines to the tools your team uses.',
    url: '/app',
    noIndex: true,
  });
}

const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  notify: 'Notifications',
  storage: 'Documents',
  crm: 'CRM',
  calendar: 'Calendar',
  automation: 'Automation',
};

/** Catalog only: connecting needs a backend integrations service (not built yet). */
function IntegrationCard({
  integration,
}: Readonly<{ integration: Integration }>) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <IntegrationLogo id={integration.id} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
      <div>
        <h3 className="font-medium">{integration.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {CATEGORY_LABELS[integration.category]}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {integration.description}
        </p>
      </div>
    </article>
  );
}

type Tab = 'all' | IntegrationCategory;

export default function IntegrationsPage() {
  // Search + tab are view state for this page only, not form data.
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INTEGRATIONS.filter(
      (i) =>
        (tab === 'all' || i.category === tab) &&
        (!needle ||
          i.name.toLowerCase().includes(needle) ||
          i.description.toLowerCase().includes(needle))
    );
  }, [query, tab]);

  const tabs: Tab[] = [
    'all',
    ...(Object.keys(CATEGORY_LABELS) as IntegrationCategory[]),
  ];

  return (
    <Page>
      <PageHeader
        title="Connected apps"
        description="Coming soon: send matches and deadlines to the apps your team already uses. Leadline works fine without them."
      />

      <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="Categories"
          className="-mx-1 flex gap-1 overflow-x-auto px-1"
        >
          {tabs.map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors',
                tab === value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {value === 'all' ? 'All' : CATEGORY_LABELS[value]}
            </button>
          ))}
        </div>
        <div className="relative md:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations"
            aria-label="Search integrations"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState title={`No integrations match “${query}”`} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((integration) => (
            <IntegrationCard key={integration.id} integration={integration} />
          ))}
        </div>
      )}
    </Page>
  );
}
