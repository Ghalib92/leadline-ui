import type { ReactNode } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '~/lib/utils';

const widths = {
  /** Forms, settings and reading: account, settings, proposals. */
  narrow: 'max-w-3xl',
  /** Most pages: lists, details, the overview. */
  default: 'max-w-6xl',
  /** Dense tables: the opportunities feed. */
  wide: 'max-w-7xl',
} as const;

/** Every dashboard page's frame: one of three widths, one padding rhythm. */
export function Page({
  width = 'default',
  className,
  children,
}: Readonly<{
  width?: keyof typeof widths;
  className?: string;
  children: ReactNode;
}>) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6 lg:py-8',
        widths[width],
        className
      )}
    >
      {children}
    </div>
  );
}

/** Nothing here yet: say what goes here and offer the one action that fills it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: Readonly<{
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-12 text-center',
        className
      )}
    >
      {Icon && <Icon className="mb-3 h-6 w-6 text-muted-foreground" />}
      <p className="font-medium">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Loading a page or a section. */
export function PageLoader({ className }: Readonly<{ className?: string }>) {
  return (
    <div
      className={cn('flex min-h-[40vh] items-center justify-center', className)}
    >
      <Loader2
        className="h-6 w-6 animate-spin text-primary"
        aria-label="Loading"
      />
    </div>
  );
}
