import type { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet';
import { cn } from '~/lib/utils';

const SIZES = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
} as const;

interface AppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Optional slot beside the title (e.g. a logo). */
  icon?: ReactNode;
  children: ReactNode;
  /**
   * Sticky action bar. Buttons stack full-width on mobile and sit right-aligned
   * on desktop. To submit a form in the body, give the form an `id` and the
   * button `type="submit" form="<id>"`.
   */
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  /** Forms pass `false` so a stray click or Escape can't discard input. */
  dismissible?: boolean;
}

/** Side panel with a fixed header, scrolling body and sticky footer. */
export function AppSheet({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  dismissible = true,
}: Readonly<AppSheetProps>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        disableOutsideClose={!dismissible}
        className={cn('w-full gap-0 overflow-hidden p-0', SIZES[size])}
      >
        <SheetHeader className="border-b border-border px-6 py-4 pr-12">
          <div className="flex items-center gap-3">
            {icon}
            <div className="min-w-0 space-y-1">
              <SheetTitle>{title}</SheetTitle>
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-background px-6 py-4 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
