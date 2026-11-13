import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { Menu } from 'lucide-react';
import type { Route } from './+types/dashboard-layout';
import { requireSession } from '~/lib/auth/middleware.server';
import { Logo } from './brand/logo';
import { DashboardSidebar } from './dashboard/dashboard-sidebar';
import { CommandMenu } from './command-menu';
import { ErrorBoundary as RouteErrorBoundary } from './error-boundary';
import { LoadingIndicator } from './loading-indicator';

/**
 * Authenticated dashboard shell: a sidebar rail + the routed content.
 *
 * The auth check runs in route middleware (server-side `redirect`, no
 * hydration flash — see `lib/auth/middleware.server.ts`). Guarding the
 * layout means every dashboard route is protected by default. Public marketing
 * pages live under `root-layout.tsx` instead and never render this chrome.
 */
export const middleware: Route.MiddlewareFunction[] = [requireSession];

/**
 * Deliberately empty. Server middleware only runs when some matched route has
 * a loader to call; without one, client-side navigations inside the dashboard
 * would never re-check the session cookie.
 */
export async function loader() {
  return null;
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <DashboardSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <LoadingIndicator />

        {/* Mobile top bar — the sidebar is an overlay below md */}
        <header className="flex h-16 items-center gap-3 border-b border-border px-4 md:hidden">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/app" className="flex items-center gap-2">
            <Logo />
          </Link>
        </header>

        <main className="min-w-0 flex-1">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>

      <CommandMenu />
    </div>
  );
}
