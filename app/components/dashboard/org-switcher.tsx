import { Link } from 'react-router';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useMyOrgs } from '~/features/orgs';
import { ROLE_LABELS, type Organization } from '~/lib/schema';
import { initials } from '~/lib/utils/format';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

function OrgAvatar({
  org,
}: Readonly<{ org?: Pick<Organization, 'name' | 'logoUrl'> }>) {
  if (org?.logoUrl) {
    return (
      <img
        src={org.logoUrl}
        alt=""
        className="h-7 w-7 rounded-md object-cover"
      />
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
      {initials(org?.name)}
    </span>
  );
}

export function OrgSwitcher({
  activeSlug: slug,
  onNavigate,
}: Readonly<{ activeSlug?: string; onNavigate?: () => void }>) {
  const { data: orgs = [] } = useMyOrgs();
  const current = orgs.find((entry) => entry.org.slug === slug);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border border-sidebar-border px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent">
        <OrgAvatar org={current?.org} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">
            {current?.org.name ?? 'Choose organization'}
          </span>
          {current && (
            <span className="block text-xs text-sidebar-foreground/60">
              {ROLE_LABELS[current.role]}
            </span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        {orgs.map(({ org, role }) => (
          <DropdownMenuItem key={org.id} asChild>
            <Link
              to={`/o/${org.slug}`}
              onClick={onNavigate}
              className="flex items-center gap-2"
            >
              <OrgAvatar org={org} />
              <span className="min-w-0 flex-1 truncate">{org.name}</span>
              <span className="text-xs text-muted-foreground">
                {ROLE_LABELS[role]}
              </span>
              {org.slug === slug && <Check className="h-4 w-4" />}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/onboarding" onClick={onNavigate}>
            <Plus className="h-4 w-4" />
            Create organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
