import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { LayoutGrid, LogIn, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './brand/logo';
import { ErrorBoundary } from './error-boundary';
import { LoadingIndicator } from './loading-indicator';
import { useAuth } from '~/lib/auth/use-auth';

const NAV = [
  { to: '/#how', label: 'How it works' },
  { to: '/#features', label: 'What it finds' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/about', label: 'About' },
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
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
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
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
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
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto grid gap-10 px-6 py-12 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo className="text-base" />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            AI workers that find clients, tenders, grants and jobs, and write
            the pitch, the bid or the application. Built in Kenya.
          </p>
        </div>
        <nav aria-label="Product" className="space-y-2 text-sm">
          <p className="font-semibold">Product</p>
          {NAV.slice(0, 3).map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="block text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Company" className="space-y-2 text-sm">
          <p className="font-semibold">Company</p>
          <Link
            to="/about"
            className="block text-muted-foreground hover:text-foreground"
          >
            About
          </Link>
          <Link
            to="/auth/login"
            className="block text-muted-foreground hover:text-foreground"
          >
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="block text-muted-foreground hover:text-foreground"
          >
            Create an account
          </Link>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="container mx-auto px-6 py-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Leadline. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
