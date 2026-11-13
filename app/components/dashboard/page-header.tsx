import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

/**
 * The one page header: optional back link, title, a meta line (status, schedule…),
 * a description, and actions on the right that wrap under the title on phones.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  meta,
}: Readonly<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  meta?: ReactNode;
}>) {
  return (
    <header className="mb-6">
      {back && (
        <Link
          to={back.to}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Wide enough for a readable title; the actions wrap below it otherwise. */}
        <div className="min-w-0 flex-1 basis-[28rem]">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {meta && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {meta}
            </div>
          )}
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
