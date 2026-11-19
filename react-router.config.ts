import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

export default {
  ssr: true,
  // Pre-render static files only. `/` is not prerendered: its header depends on
  // the signed-in session, which only the server (middleware) can read.
  prerender: ['/robots.txt', '/sitemap.xml'],
  // On Vercel (it sets VERCEL=1 during the build): server functions it can deploy.
  // The preset declares React Router 7; it uses only `serverBundles` and
  // `buildEnd`, which 8 keeps.
  presets: process.env.VERCEL ? [vercelPreset()] : [],
} satisfies Config;
