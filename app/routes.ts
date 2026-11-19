import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes';
import { authRoutes } from './auth.routes';
import { orgRoutes } from './org.routes';

export default [
  // Public marketing shell: simple header + footer, no auth.
  layout('components/root-layout.tsx', [
    index('routes/home.tsx'),
    route('about', 'routes/about.tsx'),
    route('privacy', 'routes/privacy.tsx'),
  ]),

  // Split-screen auth shell: sign-in, sign-up, password reset, invites.
  layout('components/auth-layout.tsx', authRoutes),

  // Full-screen onboarding: guarded in its own loader, no dashboard chrome.
  route('onboarding', 'routes/onboarding.tsx'),

  // Authenticated dashboard shell: sidebar + guard. Its own chrome.
  layout('components/dashboard-layout.tsx', orgRoutes),

  // Resource route that sets / clears the httpOnly session cookie.
  route('auth/session', 'routes/auth.session.ts'),
  // Backend auth: server-side calls to the auth API (tokens stay in the cookie).
  route('api/auth/:action', 'routes/api.auth.$action.ts'),
  // Same-origin proxy to the Leadline backend for live domains (`lib/api/routing.ts`).
  route('api/*', 'routes/api.$.ts'),

  route('sitemap.xml', 'routes/sitemap.xml.ts'),
  route('robots.txt', 'routes/robots.txt.ts'),
  route(
    '.well-known/appspecific/com.chrome.devtools.json',
    'routes/[.]well-known.appspecific.[com.chrome.devtools.json].ts'
  ),
] satisfies RouteConfig;
