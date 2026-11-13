import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';

interface AppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action row; stacks on mobile. Same form-submit trick as `AppSheet`. */
  footer?: ReactNode;
  dismissible?: boolean;
}

/** Centered modal for short, focused content. Prefer `AppSheet` for forms. */
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: Readonly<AppDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent disableOutsideClose={!dismissible}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
