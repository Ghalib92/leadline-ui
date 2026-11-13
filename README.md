# Leadline

Leadline helps organizations find **grants, tenders, partnerships and events** on other platforms. AI agents scan the sources; teams configure the agents and triage what they find. Built with React Router 8 (SSR + middleware), TanStack Query, and TypeScript.

It needs the Leadline backend ([`leadline_backend`](../leadline_backend)): run its API and Celery worker locally and point the server-only `API_URL` at it. Sign in with an account from the backend's `make seed`.

## Quick Start

**Prerequisites:** Node.js 22.22+, pnpm 9+, a running `leadline_backend` (`make run` + `make celery`)

```bash
pnpm install
cp .env.example .env   # Set API_URL to the backend, e.g. http://127.0.0.1:8000/api/v1
pnpm dev               # http://localhost:3000
```

## Scripts

| Command                 | Description                                                               |
| ----------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`              | Start dev server                                                          |
| `pnpm build`            | Production build                                                          |
| `pnpm start`            | Serve production build                                                    |
| `pnpm lint`             | Type-check + ESLint                                                       |
| `pnpm lint:fix`         | ESLint with `--fix`                                                       |
| `pnpm format`           | Prettier write                                                            |
| `pnpm typecheck`        | React Router typegen + `tsc`                                              |
| `pnpm test`             | Run tests (watch mode)                                                    |
| `pnpm test:run`         | Run tests (single run)                                                    |
| `pnpm test:coverage`    | Tests with coverage                                                       |
| `pnpm changeset`        | Add a changeset for the current branch (see [`RELEASE.md`](./RELEASE.md)) |
| `pnpm changeset:status` | Show pending changesets and the version they'd produce                    |

## Tech Stack

- **React 19.3** + **React Router 8** (SSR + middleware)
- **TypeScript 5.9** (strict mode)
- **Tailwind CSS 4** + **shadcn/ui** + **Radix UI**
- **Redux Toolkit** + redux-persist (auth, theme, filters, modals)
- **TanStack Query** for server state
- **React Hook Form** + **Zod** for forms/validation
- **CSS animations** (`app.css`) — server-rendered content never waits on JS to appear
- **Axios** for API calls
- **Vitest** + React Testing Library

## Project Structure

```sh
app/
  routes/           # File-based routes — *.tsx per page
  components/
    ui/             # shadcn/ui primitives
    <domain>/       # Domain UI groups
    form-fields/    # RHF + Zod field wrappers
    layout/         # Shell — navbar, footer, page-header
  features/<domain>/  # Server-state per domain — queries.ts, mutations.ts, query-keys.ts
  hooks/            # Reusable hooks — use-*.ts
  store/
    slices/         # Redux slices — *-slice.ts (auth, theme, filter, modal)
    index.ts, storage.ts, theme-sync.tsx
  lib/
    api/            # Axios client + interceptors
    providers/      # Redux + Query providers
    schema/         # Zod schemas
    types/          # Shared TS types
    utils/          # Helpers — seo, toast, format, …
    env.ts
  root.tsx, routes.ts, app.css

.changeset/         # Changesets config + pending intent files
.github/workflows/  # main.yml (PR checks + Slack), release.yml (Changesets + release Slack)
```

**Conventions:** kebab-case filenames, PascalCase exports. Each feature module owns its `queries.ts` / `mutations.ts` / `query-keys.ts` trio. Slice files end in `-slice.ts`; hook files start with `use-`. Path alias `~/` maps to `./app/`.

## Environment Variables

```env
SESSION_SECRET=...                           # Server-only; signs the httpOnly session cookie. Required in production
API_URL=http://127.0.0.1:8000/api/v1    # Server-only, required; the Leadline backend
VITE_APP_NAME=Leadline                        # Optional
VITE_GTAG_ID=G-XXXXXXXXXX                   # Optional
```

## Adding shadcn Components

```bash
pnpm dlx shadcn@latest add [component-name]
```

## Releases

This project uses **Changesets** to manage versioning, `CHANGELOG.md`, and GitHub Releases. The flow:

1. In your PR run `pnpm changeset`, pick a bump type, and commit the generated `.changeset/<slug>.md` file.
2. On merge to `main`, the release workflow opens (or updates) a "Version Packages" PR.
3. Merging that PR tags `vX.Y.Z`, creates the GitHub Release, and posts to Slack (`#releases`).

See [`RELEASE.md`](./RELEASE.md) for the full contributor guide, edge cases, and CLI cheatsheet.

## Contributing

1. Follow existing folder structure and patterns
2. Run `pnpm lint:fix && pnpm format` before committing (Husky + lint-staged enforce this)
3. Use `~/` import alias for app-relative paths
4. Add SEO meta tags for new pages via `generateSEOTags()`
5. Add a changeset (`pnpm changeset`) for any user-visible change

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for commit conventions, branch naming, and the local dev checklist.

## SEO Meta Tag Guidelines

All route pages use `generateSEOTags()` from `app/lib/utils/seo.ts` to inject SEO meta tags (title, description, Open Graph, Twitter Card) via the `meta` export.

### Meta Description Rules

- **Keep descriptions under 155 characters** — Google truncates or replaces longer descriptions with auto-generated snippets from page content
- **Use imperative, benefit-driven language** — describe what the page offers, not just what the company does
- **Match visible page content** — Google is more likely to use your meta description if it closely reflects the actual text on the page
- **No duplicate descriptions** — each route must have a unique description

### Meta Title Rules

- **Keep titles under 60 characters** — Google truncates longer titles
- **Format**: `Page Name | Leadline` (the helper appends `| Leadline` when missing)
- **Include primary keyword** near the start of the title

### Verifying SEO Tags

- SSR renders all meta tags in the initial HTML response — verify with: `curl -s https://leadline.example.com | grep 'meta name="description"'`
- After deploying changes, request re-indexing via **Google Search Console** (URL Inspection > Request Indexing)
- Use `robots.txt` and `sitemap.xml` (both configured) to guide crawlers

### `generateSEOTags()` Usage

```ts
export function meta(_args: Route.MetaArgs) {
  return [
    ...generateSEOTags({
      title: 'Page Title | Leadline', // < 60 chars
      description: 'Concise page description under 155 characters.',
      url: href('/page-path'),
      keywords: 'comma, separated, keywords',
      image: '/optional-image.png', // defaults to the site favicon
    }),
  ];
}
```
