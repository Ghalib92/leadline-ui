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
          d="M7.5 16.5 15.5 8.5M15.5 8.5h-5.5M15.5 8.5V14"
          stroke="white"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="6" r="2" fill="var(--gold)" />
      </svg>
      {withText && <span className="text-lg">Leadline</span>}
    </span>
  );
}
