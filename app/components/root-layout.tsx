import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { LayoutGrid, LogIn, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './brand/logo';
import { ErrorBoundary } from './error-boundary';
import { LoadingIndicator } from './loading-indicator';
import { useAuth } from '~/lib/auth/use-auth';
import { cn } from '~/lib/utils';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About', end: false },
];

/**
 * Public marketing shell — a deliberately light header (brand + a couple of
 * links) over the routed page and a footer. Signed-in visitors get a single
 * "Dashboard" entry point rather than app nav; the product lives in
 * the dashboard shell (`dashboard-layout.tsx`) behind that door.
 */
export default function RootLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <LoadingIndicator />

      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <AuthCta isAuthenticated={isAuthenticated} />
            </div>

            <button
              type="button"
              aria-label="Toggle menu"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="container mx-auto space-y-1 px-6 py-4">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-4 py-3 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 pt-3">
                <AuthCta
                  isAuthenticated={isAuthenticated}
                  onNavigate={() => setMobileOpen(false)}
                  full
                />
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      <Footer />
    </div>
  );
}

function AuthCta({
  isAuthenticated,
  onNavigate,
  full,
}: Readonly<{
  isAuthenticated: boolean;
  onNavigate?: () => void;
  full?: boolean;
}>) {
  if (isAuthenticated) {
    return (
      <Button asChild className={full ? 'w-full' : undefined}>
        <Link to="/app" onClick={onNavigate}>
          <LayoutGrid className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button variant="ghost" asChild className={full ? 'w-full' : undefined}>
        <Link to="/auth/login" onClick={onNavigate}>
          <LogIn className="h-4 w-4" />
          Sign in
        </Link>
      </Button>
      <Button asChild className={full ? 'w-full' : undefined}>
        <Link to="/auth/register" onClick={onNavigate}>
          Get Started
        </Link>
      </Button>
    </>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo className="text-base" />
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Leadline
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">
            About
          </Link>
          <Link to="/auth/login" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
