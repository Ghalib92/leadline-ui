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
        className="hidden flex-col items-center justify-center gap-8 bg-gradient-to-br from-primary/90 to-primary p-12 lg:flex"
      >
        <AgentCard />
        <p className="max-w-sm text-center text-lg font-medium text-primary-foreground">
          Agents that find grants, tenders and partners for your organization —
          while you do the work that matters.
        </p>
      </aside>
    </div>
  );
}
