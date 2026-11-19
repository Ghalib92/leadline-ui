import { Link, Outlet } from 'react-router';
import { Logo } from './brand/logo';
import { AgentCard } from './marketing/agent-card';
import { ErrorBoundary as RouteErrorBoundary } from './error-boundary';
import { LoadingIndicator } from './loading-indicator';

/** Split-screen shell for sign-in, sign-up, password reset and invites. */
export default function AuthLayout() {
  return (
    <div className="grid min-h-svh bg-background text-foreground lg:grid-cols-2">
      <LoadingIndicator />
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="w-fit" aria-label="Leadline home">
          <Logo />
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </div>
        </main>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Leadline
        </p>
      </div>

      <aside
        aria-hidden="true"
        className="relative hidden flex-col items-center justify-center gap-10 overflow-hidden bg-sidebar p-12 lg:flex"
      >
        <div className="relative">
          <AgentCard />
        </div>
        <div className="relative max-w-sm space-y-3 text-center">
          <p className="text-xl font-semibold tracking-tight text-sidebar-foreground">
            Clients, tenders, grants and jobs, found for you.
          </p>
          <p className="text-sm leading-relaxed text-sidebar-foreground/70">
            Every find is scored and explained. You approve it, and Leadline
            writes the pitch, the bid or the application.
          </p>
        </div>
      </aside>
    </div>
  );
}
