import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { AGENT_SOURCES, OPPORTUNITY_TYPES, labelOf } from '~/data';
import type { AgentRun } from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { ScopeChips } from '~/components/org/agent/scope-chips';

const depthLabel: Record<string, string> = {
  quick: 'Quick',
  standard: 'Standard',
  deep: 'Deep',
};

function Row({
  label,
  hint,
  children,
}: Readonly<{ label: string; hint?: string; children: ReactNode }>) {
  return (
    <div className="grid gap-1 py-3 text-sm first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt>
        <span className="text-muted-foreground">{label}</span>
        {hint && <p className="text-xs text-muted-foreground/80">{hint}</p>}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/**
 * What a run searched. Built-in searches (the AI's own web, grant, procurement
 * and news search) are kept apart from the websites people supplied.
 */
export function RunSettingsUsed({ run }: Readonly<{ run: AgentRun }>) {
  const path = useOrgPath();
  const used = run.settings;
  if (!used) return null;

  const count = (n: number, noun: string) =>
    `${n} ${noun}${n === 1 ? '' : 's'}`;
  const summary = [
    count(used.builtinSources.length, 'built-in search'),
    count(used.websites.length, 'website'),
    used.knowledgeMode === 'all'
      ? 'all documents'
      : used.knowledgeMode === 'none'
        ? 'no documents'
        : count(used.folders.length, 'folder'),
    used.depth.value &&
      `${depthLabel[used.depth.value] ?? used.depth.value} depth`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Settings used</p>
          <p className="truncate text-sm text-muted-foreground">{summary}</p>
        </div>
        {run.agentId && (
          <Link
            to={path(`/agents/${run.agentId}?tab=settings`)}
            className="hidden text-sm font-medium text-primary hover:underline sm:inline"
          >
            Search settings
          </Link>
        )}
      </summary>
      <div className="space-y-4 border-t border-border px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Grey comes from your organization, blue from the search, amber was
          chosen for this run only.
        </p>
        <dl className="divide-y divide-border">
          <Row label="Built-in searches" hint="Sources the AI searches itself">
            <ScopeChips
              items={used.builtinSources.map((s) => ({
                text: labelOf(AGENT_SOURCES, s.value),
                origin: s.origin,
              }))}
            />
          </Row>
          <Row label="Your websites" hint="Pages you asked it to read">
            {used.websites.length === 0 ? (
              <span className="text-muted-foreground">None</span>
            ) : (
              <ScopeChips
                items={used.websites.map((w) => ({
                  text: w.label || w.url,
                  origin: w.origin,
                }))}
              />
            )}
          </Row>
          <Row label="Opportunity types">
            <ScopeChips
              items={used.opportunityTypes.map((t) => ({
                text: labelOf(OPPORTUNITY_TYPES, t.value),
                origin: t.origin,
              }))}
            />
          </Row>
          <Row label="Keywords">
            <ScopeChips
              items={used.keywords.map((k) => ({
                text: k.value,
                origin: k.origin,
              }))}
            />
          </Row>
          <Row label="Company documents" hint="What the AI could read">
            {used.knowledgeMode === 'folders' ? (
              <ScopeChips
                items={used.folders.map((f) => ({
                  text: f.name,
                  origin: f.origin,
                }))}
              />
            ) : (
              <span
                className={
                  used.knowledgeMode === 'none' ? 'text-muted-foreground' : ''
                }
              >
                {used.knowledgeMode === 'all' ? 'All documents' : 'None'}
              </span>
            )}
          </Row>
          {used.depth.value && (
            <Row label="Depth">
              <ScopeChips
                items={[
                  {
                    text: depthLabel[used.depth.value] ?? used.depth.value,
                    origin: used.depth.origin,
                  },
                ]}
              />
            </Row>
          )}
        </dl>
        {run.agentId && (
          <Link
            to={path(`/agents/${run.agentId}?tab=settings`)}
            className="inline-block text-sm font-medium text-primary hover:underline sm:hidden"
          >
            Search settings
          </Link>
        )}
      </div>
    </details>
  );
}
