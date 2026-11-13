import type { ReactNode } from 'react';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

interface AppCardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Top-right slot (buttons, badges). */
  actions?: ReactNode;
  /** Bottom bar, separated by a border. */
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** One import instead of seven: header/actions/body/footer as slots. */
export function AppCard({
  title,
  description,
  actions,
  footer,
  children,
  className,
  contentClassName,
}: Readonly<AppCardProps>) {
  const hasHeader = title || description || actions;
  return (
    <Card className={className}>
      {hasHeader && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
          {actions && <CardAction>{actions}</CardAction>}
        </CardHeader>
      )}
      {children !== undefined && (
        <CardContent className={contentClassName}>{children}</CardContent>
      )}
      {footer && (
        <CardFooter className="justify-end gap-2 border-t pt-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
