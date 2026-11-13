import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  Bot,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Globe,
  Home,
  LayoutDashboard,
  Mail,
  Plug,
  Plus,
  Radar,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useActiveOrgSlug } from '~/lib/org/use-active-org';
import { useMyOrgs } from '~/features/orgs';
import { useAgents } from '~/features/agents';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '~/components/ui/command';

const openEvent = 'command-menu:open';

/** Contains-matching rather than cmdk's fuzzy default, so "east" finds
 * "East Africa grants" and not "Search history"; names that start with the
 * search rank first. */
export function matchScore(
  value: string,
  search: string,
  keywords: string[] = []
) {
  const query = search.trim().toLowerCase();
  if (!query) return 1;
  const name = value.toLowerCase();
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 0.8;
  return keywords.some((k) => k.toLowerCase().includes(query)) ? 0.5 : 0;
}

/** Open the palette from anywhere (e.g. a sidebar "Search" button). */
export function openCommandMenu() {
  document.dispatchEvent(new CustomEvent(openEvent));
}

interface Entry {
  label: string;
  /** Path inside the org (`/opportunities`) or absolute (`/account`). */
  to: string;
  icon: LucideIcon;
  keywords?: string[];
}

/** Org pages, in sidebar order. */
const orgPages: Entry[] = [
  {
    label: 'Overview',
    to: '',
    icon: LayoutDashboard,
    keywords: ['home', 'dashboard'],
  },
  {
    label: 'Opportunities',
    to: '/opportunities',
    icon: Radar,
    keywords: ['feed', 'grants', 'tenders'],
  },
  {
    label: 'Outreach',
    to: '/outreach',
    icon: Send,
    keywords: ['email', 'contacts'],
  },
  {
    label: 'Deadlines',
    to: '/calendar',
    icon: CalendarDays,
    keywords: ['calendar', 'due'],
  },
  { label: 'Team', to: '/team', icon: Users, keywords: ['members', 'invite'] },
  {
    label: 'Workers',
    to: '/agents',
    icon: Bot,
    keywords: ['workers', 'agents', 'saved searches'],
  },
  { label: 'Search history', to: '/runs', icon: Activity, keywords: ['runs'] },
];

/** The settings tabs people jump to. */
const settingsPages: Entry[] = [
  {
    label: 'Organization profile',
    to: '/settings/general',
    icon: Settings,
    keywords: ['settings', 'general'],
  },
  {
    label: 'AI summary',
    to: '/settings/general?tab=ai',
    icon: Sparkles,
    keywords: ['dossier'],
  },
  {
    label: 'Documents and folders',
    to: '/settings/general?tab=documents',
    icon: FileText,
    keywords: ['files', 'upload', 'knowledge'],
  },
  {
    label: 'Search settings',
    to: '/settings/general?tab=runs',
    icon: SlidersHorizontal,
    keywords: ['run settings', 'depth'],
  },
  {
    label: 'Sources',
    to: '/settings/general?tab=sources',
    icon: Globe,
    keywords: ['websites', 'links'],
  },
  { label: 'Integrations', to: '/settings/integrations', icon: Plug },
];

const youPages: Entry[] = [
  {
    label: 'Account',
    to: '/account',
    icon: User,
    keywords: ['profile', 'password'],
  },
  {
    label: 'Invitations',
    to: '/invitations',
    icon: Mail,
    keywords: ['invites'],
  },
  {
    label: 'Switch organization',
    to: '/app',
    icon: Home,
    keywords: ['home', 'organizations'],
  },
];

/**
 * ⌘K / Ctrl-K command palette: actions, every page, your automations by name
 * and the settings tabs. Org entries appear once you're in (or last used) an org.
 */
export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const slug = useActiveOrgSlug();
  const { data: orgs = [] } = useMyOrgs();
  const orgId = orgs.find((entry) => entry.org.slug === slug)?.org.id ?? '';
  const { data: agents = [] } = useAgents(orgId);
  const base = slug ? `/o/${slug}` : null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener(openEvent, onOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener(openEvent, onOpen);
    };
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  const items = (entries: Entry[], prefix = '') =>
    entries.map((entry) => (
      <CommandItem
        key={entry.label}
        value={entry.label}
        keywords={entry.keywords}
        onSelect={() => go(`${prefix}${entry.to}`)}
      >
        <entry.icon />
        {entry.label}
      </CommandItem>
    ));

  return (
    <CommandDialog open={open} onOpenChange={setOpen} filter={matchScore}>
      <CommandInput placeholder="Search pages, workers and actions…" />
      <CommandList>
        <CommandEmpty>
          Nothing matches. Try a page or a worker’s name.
        </CommandEmpty>
        {base && (
          <>
            <CommandGroup heading="Actions">
              <CommandItem
                value="New worker"
                keywords={['create', 'worker', 'agent', 'saved search']}
                onSelect={() => go(`${base}/agents?new=1`)}
              >
                <Plus />
                New worker
              </CommandItem>
              <CommandItem
                value="Review opportunities"
                keywords={['approve', 'reject', 'pending']}
                onSelect={() => go(`${base}/opportunities?review=pending`)}
              >
                <ClipboardCheck />
                Review opportunities
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Go to">{items(orgPages, base)}</CommandGroup>
            {agents.length > 0 && (
              <CommandGroup heading="Workers">
                {agents.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    // cmdk matches on `value`; the id keeps two same-named ones apart.
                    value={`${agent.name} ${agent.id}`}
                    keywords={['worker', 'automation', 'agent']}
                    onSelect={() => go(`${base}/agents/${agent.id}`)}
                  >
                    <Bot />
                    {agent.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandGroup heading="Settings">
              {items(settingsPages, base)}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="You">{items(youPages)}</CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
