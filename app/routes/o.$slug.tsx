import { useEffect } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { OrgNotFoundError, orgKeys, useOrgBySlug } from '~/features/orgs';
import { OrgProvider } from '~/lib/org/org-context';
import { writeLastOrg } from '~/lib/org/last-org';
import { toastUtils } from '~/lib/utils/toast';
import { Button } from '~/components/ui/button';
import { PageLoader } from '~/components/dashboard/page';

/**
 * Resolves the org client-side from my orgs list (React Query), so switching
 * between pages in an org reuses the cached org. The auth guard stays
 * server-side in `dashboard-layout.tsx`.
 */
export default function OrgLayout() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, error, isPending, refetch } = useOrgBySlug(slug);
  const status = isAxiosError(error)
    ? error.response?.status
    : error instanceof OrgNotFoundError
      ? error.status
      : undefined;

  useEffect(() => {
    if (data) writeLastOrg(data.org.slug);
  }, [data]);

  useEffect(() => {
    if (status !== 403) return;
    toastUtils.error('No access', 'You’re not a member of that organization.');
    queryClient.invalidateQueries({ queryKey: orgKeys.mine() });
    navigate('/app', { replace: true });
  }, [status, navigate, queryClient]);

  if (status === 404) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Organization not found</h1>
        <p className="text-sm text-muted-foreground">
          It may have been archived, you may have left it, or the link is wrong.
        </p>
        <Button asChild variant="outline">
          <Link to="/app">Go to my workspace</Link>
        </Button>
      </div>
    );
  }

  if (error && status !== 403) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">
          Something went wrong loading this organization.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (isPending || !data) {
    return <PageLoader className="min-h-[60vh]" />;
  }

  return (
    <OrgProvider value={data}>
      {data.view.isArchived && (
        <div className="border-b border-amber-300/60 bg-amber-50 px-6 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          This organization is archived. It’s read-only and hidden from members
          until an admin restores it in Settings.
        </div>
      )}
      <Outlet />
    </OrgProvider>
  );
}
