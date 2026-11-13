import type { ReactNode } from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export type AppDropdownItem =
  | {
      label: string;
      icon?: LucideIcon;
      onSelect: () => void;
      destructive?: boolean;
      disabled?: boolean;
    }
  | 'separator';

interface AppDropdownProps {
  items: AppDropdownItem[];
  /** Custom trigger; defaults to a "⋯" icon button labelled `label`. */
  trigger?: ReactNode;
  /** Accessible name for the default trigger, and an optional menu heading. */
  label: string;
  showLabel?: boolean;
  align?: 'start' | 'end';
}

/** Menu from a data list — no DropdownMenu* sub-component imports. */
export function AppDropdown({
  items,
  trigger,
  label,
  showLabel = false,
  align = 'end',
}: Readonly<AppDropdownProps>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" aria-label={label}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-44">
        {showLabel && <DropdownMenuLabel>{label}</DropdownMenuLabel>}
        {items.map((item, index) =>
          item === 'separator' ? (
            <DropdownMenuSeparator key={`sep-${index}`} />
          ) : (
            <DropdownMenuItem
              key={item.label}
              onSelect={item.onSelect}
              disabled={item.disabled}
              className={cn(
                item.destructive && 'text-destructive focus:text-destructive'
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
