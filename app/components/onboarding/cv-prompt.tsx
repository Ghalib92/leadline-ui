import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { FileUp } from 'lucide-react';
import { useDocuments } from '~/features/orgs';
import { useAuth } from '~/lib/auth/use-auth';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { Button } from '~/components/ui/button';
import { AppDialog } from '~/components/composed';
import { TOUR_CLOSED_EVENT, wasDone } from './first-run-tour';

const dismissedKey = (orgId: string) => `leadline:cv-prompt:${orgId}`;

function wasDismissed(orgId: string) {
  try {
    return globalThis.sessionStorage?.getItem(dismissedKey(orgId)) === '1';
  } catch {
    return false;
  }
}

function dismiss(orgId: string) {
  try {
    globalThis.sessionStorage?.setItem(dismissedKey(orgId), '1');
  } catch {
    // storage blocked: it may ask again on the next page
  }
}

/**
 * A job seeker without a CV is asked for it as soon as they come in: nothing
 * is searched until it is there. Waits for the first-run tour, skips the CV
 * page itself, and "Later" quiets it until the next visit (session).
 */
export function CvPrompt() {
  const { view } = useOrg();
  const { user } = useAuth();
  const path = useOrgPath();
  const { pathname, search } = useLocation();
  const candidate = view.isCandidate;
  const { data: documents, isPending } = useDocuments(candidate ? view.id : '');
  const [tourDone, setTourDone] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(wasDismissed(view.id));
    if (user?.id) setTourDone(wasDone(user.id));
    const onClosed = () => setTourDone(true);
    globalThis.window?.addEventListener(TOUR_CLOSED_EVENT, onClosed);
    return () =>
      globalThis.window?.removeEventListener(TOUR_CLOSED_EVENT, onClosed);
  }, [view.id, user?.id]);

  const onCvPage =
    pathname.endsWith('/settings/general') &&
    new URLSearchParams(search).get('tab') === 'cv';
  const open =
    candidate &&
    !isPending &&
    (documents?.length ?? 0) === 0 &&
    tourDone &&
    !dismissed &&
    !onCvPage &&
    view.myRole === 'admin';

  const later = () => {
    dismiss(view.id);
    setDismissed(true);
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => !next && later()}
      title={
        <span className="inline-flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" /> Upload your CV to start
        </span>
      }
      description="Leadline scores every job against your CV and writes your cover letters from it, so it can’t look for jobs until your CV is in. It takes a minute."
      footer={
        <>
          <Button variant="outline" onClick={later}>
            Later
          </Button>
          <Button asChild onClick={later}>
            <Link to={path('/settings/general?tab=cv')}>Upload my CV</Link>
          </Button>
        </>
      }
    />
  );
}
