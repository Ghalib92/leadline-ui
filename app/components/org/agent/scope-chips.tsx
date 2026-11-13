import type { SettingOrigin } from '~/lib/schema';
import { cn } from '~/lib/utils';

const chipTitle = {
  organization: 'From your organization',
  agent: 'Added by this worker',
  run: 'Chosen for this run only',
} as const;

/** Chips: the organization's in grey, the automation's in the brand color,
 * this run's own choices in amber. */
export function ScopeChips({
  items,
}: Readonly<{ items: { text: string; origin: SettingOrigin }[] }>) {
  if (items.length === 0)
    return <span className="text-muted-foreground">None</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={`${item.origin}:${item.text}`}
          title={chipTitle[item.origin]}
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs',
            item.origin === 'organization' &&
              'border border-border bg-muted/50',
            item.origin === 'agent' && 'bg-primary/10 font-medium text-primary',
            item.origin === 'run' &&
              'bg-amber-500/10 font-medium text-amber-700 dark:text-amber-400'
          )}
        >
          {item.text}
        </li>
      ))}
    </ul>
  );
}
