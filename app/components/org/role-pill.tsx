import { Shield } from 'lucide-react';
import { ROLE_LABELS, type Role } from '~/lib/schema';
import { cn } from '~/lib/utils';

export function RolePill({ role }: Readonly<{ role: Role }>) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        role === 'admin' &&
          'bg-violet-500/10 text-violet-700 dark:text-violet-400',
        role === 'member' && 'bg-muted text-muted-foreground'
      )}
    >
      <Shield className="mr-1 h-3 w-3 shrink-0" />
      {ROLE_LABELS[role]}
    </span>
  );
}
