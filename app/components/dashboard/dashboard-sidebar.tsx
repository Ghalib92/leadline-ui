import { Link, NavLink } from 'react-router';
import {
  Activity,
  Bot,
  Building2,
  CalendarDays,
  ClipboardList,
  Send,
  Home,
  LogOut,
  Mail,
  PhoneCall,
  Plug,
  Radar,
  Search,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import { openCommandMenu } from '~/components/command-menu';
import { Logo } from '~/components/brand/logo';
import { useAuth } from '~/lib/auth/use-auth';
import { useLogout } from '~/features/auth';
import { usePendingInvitations } from '~/features/invitations';
import { useMyOrgs } from '~/features/orgs';
import { toastUtils } from '~/lib/utils/toast';
import { initials } from '~/lib/utils/format';
import { cn } from '~/lib/utils';
import { OrgSwitcher } from './org-switcher';
import { useActiveOrgSlug } from '~/lib/org/use-active-org';

function navFor(slug: string | undefined, candidate = false) {
  if (!slug) {
    return [
      {
        heading: 'Workspace',
        items: [{ to: '/app', label: 'Home', icon: Home, end: true }],
      },
    ];
  }
  const base = `/o/${slug}`;
  return [
    {
      heading: 'Workspace',
      items: [
        { to: base, label: 'Overview', icon: Home, end: true },
        {
          to: `${base}/opportunities`,
          label: candidate ? 'Jobs' : 'Opportunities',
          icon: Radar,
          end: false,
        },
        // A job seeker works alone and calls no clients; the same list tracks
        // their applications.
        ...(candidate
          ? [
              {
                to: `${base}/calls`,
                label: 'Applications',
                icon: ClipboardList,
                end: false,
              },
            ]
          : [
              {
                to: `${base}/calls`,
                label: 'Call list',
                icon: PhoneCall,
                end: false,
              },
              {
                to: `${base}/outreach`,
                label: 'Outreach',
                icon: Send,
                end: false,
              },
            ]),
        {
          to: `${base}/calendar`,
          label: 'Deadlines',
          icon: CalendarDays,
          end: false,
        },
        ...(candidate
          ? []
          : [{ to: `${base}/team`, label: 'Team', icon: Users, end: false }]),
        {
          to: `${base}/agents`,
          label: 'Workers',
          icon: Bot,
          end: false,
        },
        {
          to: `${base}/runs`,
          label: 'Search history',
          icon: Activity,
          end: false,
        },
      ],
    },
    {
      heading: 'Settings',
      items: [
        {
          to: `${base}/settings/general`,
          label: 'General',
          icon: Building2,
          end: false,
        },
        {
          to: `${base}/settings/integrations`,
          label: 'Integrations',
          icon: Plug,
          end: false,
        },
      ],
    },
  ];
}

/**
 * Dashboard sidebar — brand, org switcher, org-scoped nav, and the signed-in
 * user's controls.
 *
 * On desktop it's a fixed rail; on mobile it slides in as an overlay driven by
 * `open`/`onClose` from the layout.
 */
export function DashboardSidebar({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const logout = useLogout();
  const { user } = useAuth();
  const slug = useActiveOrgSlug();
  const { data: myInvites = [] } = usePendingInvitations();
  const { data: myOrgs = [] } = useMyOrgs(!!slug);
  const candidate = !!myOrgs.find((m) => m.org.slug === slug)?.org.isCandidate;

  const handleLogout = async () => {
    await logout.mutateAsync('/');
    toastUtils.success('Signed out', 'See you next time.');
  };

  return (
    <>
      {/* Mobile scrim */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:sticky md:top-0 md:h-svh md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link to="/app" onClick={onClose}>
            <Logo />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 p-3">
          <OrgSwitcher activeSlug={slug} onNavigate={onClose} />
          <button
            type="button"
            onClick={() => {
              onClose();
              openCommandMenu();
            }}
            className="flex w-full items-center gap-2 rounded-md border border-sidebar-border px-3 py-1.5 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Search className="h-4 w-4" />
            <span>Search…</span>
            <kbd className="ml-auto rounded border border-sidebar-border px-1.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3">
          {navFor(slug, candidate).map((group) => (
            <div key={group.heading} className="space-y-1">
              <p className="px-2 py-2 text-xs font-medium text-sidebar-foreground/60">
                {group.heading}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-3">
          <NavLink
            to="/invitations"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )
            }
          >
            <Mail className="h-4 w-4" />
            Invitations
            {myInvites.length > 0 && (
              <span
                className="ml-auto rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums"
                aria-label={`${myInvites.length} pending`}
              >
                {myInvites.length}
              </span>
            )}
          </NavLink>
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {initials(user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.name ?? 'Account'}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60">
                {user?.email}
              </p>
            </div>
          </div>
          <NavLink
            to="/account"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'mt-1 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent'
              )
            }
          >
            <UserCircle className="h-4 w-4" />
            Account
          </NavLink>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
