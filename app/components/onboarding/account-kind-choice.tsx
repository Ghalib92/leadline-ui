import { Briefcase, Building2 } from 'lucide-react';
import type { AccountKind } from '~/lib/account-kind';
import { cn } from '~/lib/utils';

export const ACCOUNT_KINDS: {
  value: AccountKind;
  title: string;
  body: string;
  icon: typeof Building2;
}[] = [
  {
    value: 'organization',
    title: 'My business or organization',
    body: 'Find clients, tenders and grants, and get the pitch or the bid written.',
    icon: Building2,
  },
  {
    value: 'candidate',
    title: 'I’m looking for a job',
    body: 'Find jobs that fit your CV on company career pages and job boards.',
    icon: Briefcase,
  },
];

/** "What brings you to Leadline?": the first question, before anything else. */
export function AccountKindChoice({
  onPick,
  subtitle = 'Pick one. You can add the other later.',
  columns = 2,
}: Readonly<{
  onPick: (kind: AccountKind) => void;
  subtitle?: string;
  /** Two cards side by side, or stacked (narrow sign-up column). */
  columns?: 1 | 2;
}>) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        What brings you to Leadline?
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className={cn('mt-6 grid gap-4', columns === 2 && 'sm:grid-cols-2')}>
        {ACCOUNT_KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPick(option.value)}
            className="rounded-xl border border-border bg-background p-5 text-left transition-colors hover:border-primary hover:bg-primary/5"
          >
            <option.icon className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">{option.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{option.body}</p>
          </button>
        ))}
      </div>
    </>
  );
}
