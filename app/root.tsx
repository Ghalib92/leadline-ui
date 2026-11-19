import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { Toaster } from 'react-hot-toast';

import type { Route } from './+types/root';
// Self-hosted (Fontsource): no request to a font CDN, works offline.
import '@fontsource-variable/figtree';
import './app.css';
import { loadGTagScripts } from './lib/utils/add-google-tag';
import { QueryProvider } from './lib/providers/query-provider';
import { StoreProvider } from './lib/providers/store-provider';
import { env } from './lib/env';
import { sessionMiddleware } from './lib/auth/middleware.server';
import { sessionContext } from './lib/auth/context';

/** Icons for every browser and phone (rendered from public/brand/leadline-mark.svg). */
export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
];

/** Session cookie → `sessionContext`, for every loader and action. */
export const middleware: Route.MiddlewareFunction[] = [sessionMiddleware];

/**
 * Surfaces auth for rendering (`useAuth()`): the user only — tokens stay in
 * the httpOnly cookie.
 */
export async function loader({ context }: Route.LoaderArgs) {
  return { auth: context.get(sessionContext) };
}

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  /**
   * Google Analytics Tracking ID
   * Replace 'G-XXXXXXXXXX' with your actual tracking ID or set it in the environment variable VITE_GTAG_ID
   */
  const GTAG = env.VITE_GTAG_ID;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0e1825" />
        <Meta />
        <Links />
        {GTAG && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG}`}
            ></script>
            <script dangerouslySetInnerHTML={loadGTagScripts(GTAG)}></script>
          </>
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <QueryProvider>
        <Outlet />
        {/*
         * Mounted here, not in a layout, so every route can raise a toast —
         * including any route added outside `components/root-layout.tsx`.
         *
         * Only `duration` is meaningful: toastUtils.success/error/info/warning
         * render `toast.custom(<CustomToast />)` and bring their own styling, so
         * `style` / `iconTheme` here would silently do nothing.
         */}
        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, success: { duration: 3000 } }}
        />
      </QueryProvider>
    </StoreProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
