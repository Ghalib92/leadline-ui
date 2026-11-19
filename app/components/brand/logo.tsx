import { cn } from '~/lib/utils';

/**
 * Leadline's mark: an "L" whose foot rises into a line that leads to a gold
 * dot, the opportunity. The same drawing as public/brand/leadline-mark.svg
 * (the favicon and app icons are rendered from that file).
 */
export function LogoMark({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('h-7 w-7 shrink-0', className)}
    >
      <rect width="32" height="32" rx="9" fill="#036f4f" />
      <path
        d="M9.5 8v12.5h5.6l5.9-7.2"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24.2" cy="9.3" r="2.7" fill="#ebc573" />
    </svg>
  );
}

/** The mark and the wordmark. */
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
      <LogoMark />
      {withText && <span className="text-lg tracking-[-0.02em]">Leadline</span>}
    </span>
  );
}
