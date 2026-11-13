import { ChevronDown, X, type LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

interface FilterPillProps {
  label: string;
  icon?: LucideIcon;
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Filters can be cleared ("Any"); a sort pill cannot. */
  clearable?: boolean;
}

/**
 * Compact `Label · Value ▾` toolbar pill (Aboard / Delphi / Profound pattern).
 * An active filter is tinted and gets an inline × to clear it.
 */
export function FilterPill({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  clearable = true,
}: Readonly<FilterPillProps>) {
  const selected = options.find((option) => option.value === value);
  const active = clearable && !!selected;

  return (
    <div
      className={cn(
        'inline-flex h-8 shrink-0 items-center rounded-full border text-xs transition-colors',
        active
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted'
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex h-full items-center gap-1.5 rounded-full pl-3 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring',
            active ? 'pr-1' : 'pr-2.5'
          )}
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}
          <span>{label}</span>
          <span
            className={cn(
              'max-w-[120px] truncate sm:max-w-[170px]',
              !active && 'text-foreground'
            )}
            title={selected?.label ?? 'Any'}
          >
            {selected?.label ?? 'Any'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44">
          <DropdownMenuRadioGroup
            value={value ?? ''}
            onValueChange={(next) => onChange(next || null)}
          >
            {clearable && (
              <DropdownMenuRadioItem value="">Any</DropdownMenuRadioItem>
            )}
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {active && (
        <button
          type="button"
          aria-label={`Clear ${label} filter`}
          onClick={() => onChange(null)}
          className="mr-1 rounded-full p-1 hover:bg-primary/15"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
