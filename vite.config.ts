import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { devtools } from '@tanstack/devtools-vite';
import netlifyReactRouter from '@netlify/vite-plugin-react-router';

const isNetlify = process.env.VITE_NETLIFY === 'true';

export default defineConfig(({ mode }) => {
  // Server-only settings from .env aren't exposed by Vite (only VITE_* are), so
  // hand them to process.env for the `lib/auth/*.server.ts` modules in
  // dev/preview. A real environment variable always wins.
  const fileEnv = loadEnv(mode, process.cwd(), '');
  for (const key of ['SESSION_SECRET', 'API_URL']) {
    if (!process.env[key] && fileEnv[key]) process.env[key] = fileEnv[key];
  }

  return {
    plugins: [
      tailwindcss(),
      reactRouter(),
      tsconfigPaths(),
      isNetlify && netlifyReactRouter(),
      devtools(),
    ],
    build: {
      sourcemap: false,
    },
    // Pre-bundled at start: otherwise the first visit to a page that uses one of
    // these makes Vite re-bundle and reload mid-session, and the page crashes once
    // with "Invalid hook call" (two copies of React). Dev server only.
    optimizeDeps: {
      include: [
        'react-hook-form',
        '@hookform/resolvers/zod',
        'cmdk',
        '@tanstack/react-table',
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/extension-highlight',
        '@tiptap/extension-placeholder',
        'tiptap-markdown',
      ],
    },
    server: {
      port: 3000,
      strictPort: true,
    },
  };
});
