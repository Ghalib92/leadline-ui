import { cn } from '~/lib/utils';

/** Leadline wordmark: an arrow heading up-right, i.e. going after something. */
export function Logo({
  className,
  withText = true,
}: Readonly<{ className?: string; withText?: boolean }>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-semibold tracking-tight',
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7 shrink-0 text-primary"
      >
        <rect width="24" height="24" rx="7" fill="currentColor" />
        <path
          d="M8 16 16 8M16 8h-5.5M16 8v5.5"
          stroke="white"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withText && <span className="text-lg">Leadline</span>}
    </span>
  );
}
