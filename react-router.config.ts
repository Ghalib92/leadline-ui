import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  // Pre-render static files only. `/` is not prerendered: its header depends on
  // the signed-in session, which only the server (middleware) can read.
  prerender: ['/robots.txt', '/sitemap.xml'],
} satisfies Config;
