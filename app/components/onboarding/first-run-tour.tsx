import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/lib/auth/use-auth';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { cn } from '~/lib/utils';

/** Fired by "Take the tour" (command menu) to show the tour again. */
export const TOUR_EVENT = 'leadline:tour';

export function startTour() {
  globalThis.window?.dispatchEvent(new Event(TOUR_EVENT));
}

interface Step {
  /** The sidebar items (`data-tour`) this step is about; none for the first and last. */
  target?: string;
  title: string;
  body: string;
}

const BUSINESS: Step[] = [
  {
    title: 'Welcome to Leadline',
    body: 'Leadline looks for work for you: clients, tenders and grants. Here is how it works, in four steps.',
  },
  {
    target: 'searches',
    title: '1. Set up a search',
    body: 'A search looks for one kind of opportunity, every day or every week, on its own. This is where you start.',
  },
  {
    target: 'opportunities',
    title: '2. See what it found',
    body: 'Everything it finds lands here, scored out of 100 with the reasons. Approve the good ones and reject the rest. Leadline learns from your reasons.',
  },
  {
    target: 'follow-up',
    title: '3. Follow up',
    body: 'What you approve moves here: clients to call, emails to funders and every deadline. For a tender or grant, Leadline drafts the bid for you to edit. Nothing is sent without you.',
  },
  {
    target: 'profile',
    title: '4. Tell it about you',
    body: 'Your profile and documents, like past projects, certificates and your company profile, make the matches and drafts better. Add more any time.',
  },
  {
    title: 'You’re ready',
    body: 'Set up your first search and Leadline starts looking. You can take this tour again from the search box (⌘K).',
  },
];

const JOB_SEEKER: Step[] = [
  {
    title: 'Welcome to Leadline',
    body: 'Leadline looks for jobs that fit your CV and helps you apply. Here is how it works, in four steps.',
  },
  {
    target: 'searches',
    title: '1. Set up a search',
    body: 'A search looks for jobs that fit you, every day or every week, on its own. This is where you start.',
  },
  {
    target: 'opportunities',
    title: '2. See the jobs it found',
    body: 'Each job is scored against your CV, with what fits and what is missing. Approve the ones you want.',
  },
  {
    target: 'follow-up',
    title: '3. Apply',
    body: 'Approved jobs move to Applications. Leadline writes a cover letter and a CV for that job; you apply on their site and note each step here.',
  },
  {
    target: 'profile',
    title: '4. Keep your CV up to date',
    body: 'Every score and every letter comes from your CV, so the better it is, the better the results.',
  },
  {
    title: 'You’re ready',
    body: 'Set up your first search and Leadline starts looking. You can take this tour again from the search box (⌘K).',
  },
];

function doneKey(userId: string) {
  return `leadline:tour-done:${userId}`;
}

function wasDone(userId: string) {
  try {
    return globalThis.localStorage?.getItem(doneKey(userId)) === '1';
  } catch {
    return true; // storage blocked: don't show it on every visit
  }
}

function markDone(userId: string) {
  try {
    globalThis.localStorage?.setItem(doneKey(userId), '1');
  } catch {
    // storage blocked; the tour simply shows again next time
  }
}

/** Marks the sidebar items a step is about, so CSS can light them up. */
function useHighlight(target: string | undefined) {
  useEffect(() => {
    if (!target || typeof globalThis.document === 'undefined') return;
    const items = globalThis.document.querySelectorAll(
      `[data-tour="${target}"]`
    );
    items.forEach((item) => item.setAttribute('data-tour-active', ''));
    return () =>
      items.forEach((item) => item.removeAttribute('data-tour-active'));
  }, [target]);
}

/**
 * A first-visit walk through the app, in the order people use it. Shown once per
 * person (remembered in this browser), and again on request (`startTour()`).
 * A floating card, not a modal: the sidebar item each step is about stays
 * visible and lit.
 */
export function FirstRunTour() {
  const { user } = useAuth();
  const { org, can } = useOrg();
  const path = useOrgPath();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const steps = org.isCandidate ? JOB_SEEKER : BUSINESS;
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => {
    if (user?.id && !wasDone(user.id)) setOpen(true);
  }, [user?.id]);

  useEffect(() => {
    const show = () => {
      setIndex(0);
      setOpen(true);
    };
    globalThis.window?.addEventListener(TOUR_EVENT, show);
    return () => globalThis.window?.removeEventListener(TOUR_EVENT, show);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    if (user?.id) markDone(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    heading.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    globalThis.window?.addEventListener('keydown', onKey);
    return () => globalThis.window?.removeEventListener('keydown', onKey);
  }, [open, index, close]);

  useHighlight(open ? step.target : undefined);

  if (!open) return null;

  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
      className="animate-fade-up fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-border bg-card p-5 shadow-xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          id="tour-title"
          ref={heading}
          tabIndex={-1}
          className="text-base font-semibold outline-none"
        >
          {step.title}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label="Close the tour"
          className="-mt-1 -mr-1 rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {step.body}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div
          className="flex gap-1.5"
          aria-label={`Step ${index + 1} of ${steps.length}`}
        >
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-5 bg-primary' : 'w-1.5 bg-border'
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex(index - 1)}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {last ? (
            can('agents.create') ? (
              <Button size="sm" asChild onClick={close}>
                <Link to={path('/agents?new=1')}>Set up a search</Link>
              </Button>
            ) : (
              <Button size="sm" onClick={close}>
                Done
              </Button>
            )
          ) : (
            <Button size="sm" onClick={() => setIndex(index + 1)}>
              {index === 0 ? 'Show me' : 'Next'}{' '}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {index === 0 && (
        <button
          type="button"
          onClick={close}
          className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Skip the tour
        </button>
      )}
    </section>
  );
}
