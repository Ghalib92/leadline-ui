# Agents

This document describes the automated agents, workflows, and project conventions for Leadline, the frontend UI service.

## Project Overview

**Leadline** helps organizations discover opportunities — **grants & funding,
tenders & RFPs, partnerships, events & awards** — published on other platforms.
AI agents search built-in sources (open web, grant databases, procurement
portals, news) and score what they find; people
configure the agents and triage what they find. Everything runs on the Django
backend (`leadline_backend`) at `API_URL` — there is no in-browser mock.

Shells:

- **Marketing** (`components/root-layout.tsx`) — public: home (`/`), about
  (`/about`). Light header; a "Dashboard" button (→ `/app`) when signed in.
- **Auth** (`components/auth-layout.tsx`) — split screen: login, register,
  forgot/reset password, invite acceptance (`/invite/:token`).
- **Onboarding** (`routes/onboarding.tsx`) — standalone, guarded in its own loader:
  create an organization and its attributes (3-step `MultiStepForm`).
- **Dashboard** (`components/dashboard-layout.tsx`) — authenticated sidebar shell,
  guarded in its loader (server-side redirect). Holds `/app` (post-login resolver),
  `/account`, `/invitations` (your inbox of org invites — Pending and History tabs,
  from `GET /organizations/invitations/received/`; badge in the sidebar),
  and the org layout `routes/o.$slug.tsx` with overview, opportunities, agents,
  runs, outreach, deadlines, team, and settings (general, integrations).

Design spec: `docs/superpowers/specs/2026-09-23-leadline-platform-design.md`.

## Tech Stack

- **Framework**: React 19.3 + React Router 8 (SSR, middleware always on) + Vite 7
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **State**: Redux Toolkit (table filters, modals) — auth is a server session, not Redux
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **Animations**: CSS keyframes (`app.css`) — no animation library
- **API Client**: Axios
- **Package Manager**: pnpm 9 (Node >= 22.22)

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build (react-router build)
pnpm start        # Serve production build
pnpm lint         # tsc --noEmit && eslint .
pnpm lint:fix     # ESLint with --fix
pnpm test         # Vitest (watch mode)
pnpm test:run     # Vitest single run
pnpm test:coverage # Vitest with coverage
pnpm typecheck    # react-router typegen && tsc
```

## Project Structure

Routes use a **flat file naming** convention (`o.$slug.settings.members.tsx`,
not `o/$slug/settings/members.tsx`), assembled in `app/*.routes.ts` files and
composed in `app/routes.ts` under the shells.

```
app/
  routes.ts            # Route config: marketing, auth, onboarding, dashboard
  {auth,org}.routes.ts # Route groups, imported by routes.ts
  routes/              # Route modules (flat names)
    home.tsx  about.tsx
    auth.{login,register,verify-email,forgot-password,reset-password}.tsx  invite.$token.tsx
    auth.session.ts  api.auth.$action.ts   # resource routes: session cookie; backend-auth BFF
    onboarding.tsx  app.tsx  account.tsx
    o.$slug.tsx                      # org layout (client-side org resolution)
    o.$slug._index.tsx               # overview
    o.$slug.opportunities.tsx  o.$slug.opportunities.$id.tsx
    o.$slug.agents.tsx               # "Automations" list; create is a sheet (?new)
    o.$slug.agents.$id.tsx           # one automation: Overview, History, Opportunities, Settings (?tab=)
    o.$slug.runs.tsx  o.$slug.runs.$id.tsx   # run history; run detail (workflow + matching)
    invitations.tsx                  # signed-in user's pending invites
    o.$slug.team.tsx                 # roster (backend members) + invitations
    o.$slug.settings.{general,integrations}.tsx   # integrations: static "Coming soon" catalog
  components/
    composed/             # AppCard, AppSheet, AppDialog, AppDropdown, AppTabs (see below)
    root-layout.tsx  auth-layout.tsx  dashboard-layout.tsx
    brand/logo.tsx
    marketing/            # hero, agent-card, how-it-works, faq, …
    onboarding/steps.tsx
    org/                  # org-profile-fields, invite-sheet, agent-form-sheet, role-pill, integration-logo
    dashboard/            # dashboard-sidebar, org-switcher, page-header
    forms/                # Login/Register/VerifyEmail/ForgotPassword/ResetPasswordCode forms
    form-fields/          # Reusable RHF field components (see Forms)
    ui/                   # shadcn/ui (button, dialog, sheet, …) + local `picker`
    data-table.tsx  error-boundary.tsx  loading-indicator.tsx  command-menu.tsx
  features/
    auth/          # login/register/logout/session + forgot/reset/profile/password
    orgs/  members/  invitations/  agents/  runs/  opportunities/
    reviews/  proposals/  outreach/
                   # each: queries, mutations, query-keys (+ badges/columns/tiles)
  data/            # Vocabularies (taxonomy, org-taxonomy) + static integrations catalog
  lib/
    api/
      client.ts    # Axios instance: same-origin `/api`, 401 → sign out
      backend.ts   # orgApi(), repeatParams, downloadFile()
    auth/          # session.server.ts (httpOnly cookie), middleware.server.ts, context.ts, use-auth.ts, safe-redirect.ts
    org/           # can.ts (permissions), org-context.tsx (useOrg), use-org-path.ts, last-org.ts
    schema/        # Zod schemas + backend DTO mappers (backend, leadline, organization, knowledge, member, …) (+ resolvers)
    utils/         # seo, structured-data, extract-error, slugify, format, cn
    env.ts         # Zod-validated environment variables
    providers/     # store-provider (Redux), query-provider
  store/
    index.ts       # Redux store config (UI state only)
    slices/        # auth, table-filters, modal
    filters/use-table-filters.ts
  root.tsx         # Session middleware + root loader + StoreProvider > QueryProvider
  app.css          # Tailwind + shadcn CSS variables ("Evergreen & Ink" palette)
```

## Key Patterns

### SSR Compatibility

- SSR is **enabled** (`react-router.config.ts: ssr: true`)
- React Router **middleware** is always on in v8 (no flag); server-only code
  lives in `*.server.ts` files and is only imported from `middleware`/`loader`/`action`.
- Always reach for browser globals via `globalThis` — `globalThis.window`, `globalThis.document`, `globalThis.navigator` — and guard with `typeof globalThis.window !== 'undefined'` rather than bare `window`. Makes the "may not exist on server" intent explicit and avoids shadowing surprises.

### State Management

- **Redux Toolkit** for global state (auth, table filters, modals)
- **Keyed table filters**: `useTableFilters(`opportunities:${org.id}`)` (from
  `store/filters/use-table-filters.ts`) returns `{ state, params, setSearch,
setFilter, removeFilter, setSort, … }`. State lives in the `tableFilters` slice
  (`slices/table-filters-slice.ts`).
- **Keyed modals**: `useAppModal<T>('key')` returns `{ isOpen, data, open, close, toggle }`
  - Type-safe via `ModalRegistry` interface (declaration merging)
- **Typed hooks**: use `useAppDispatch` and `useAppSelector` (not raw `useDispatch`)
- There is **no live theme editor / hue system** — the palette is fixed in
  `app.css`, "Evergreen & Ink": evergreen primary, ink-navy text and sidebar,
  warm ivory background with white cards, and one `gold` accent kept for the
  best matches only. Status colours (emerald, amber, rose) mean done, waiting,
  problem; don't use rose for anything that isn't a problem.

### Auth (httpOnly session cookie + middleware)

- The session is a **signed, httpOnly** cookie (`__leadline_session`,
  `lib/auth/session.server.ts`) holding **only the backend's access + refresh
  JWTs** — no profile data, nothing page JavaScript can read. Signed with
  `SESSION_SECRET`; production refuses to issue sessions without it (dev falls
  back to a local secret).
- **`API_URL` is required** (server-only, e.g. `http://127.0.0.1:8000/api/v1` —
  the Django `leadline_backend`). `backendUrl()` throws without it, so every page
  fails loudly instead of half-working.
- The browser posts JSON to our own `/api/auth/:action` resource route
  (`routes/api.auth.$action.ts`), which calls the backend and puts the tokens in
  the cookie — **no token ever reaches the browser**. `sessionMiddleware`
  refreshes an expired access token server-side (rotations are shared between
  concurrent requests), loads the profile, and clears the cookie when the refresh
  is rejected. Sign-up and an unverified sign-in go to `/auth/verify-email`
  (6-digit emailed code); password reset is email + code
  (`/auth/forgot-password` → `/auth/reset-password?email=`). Logout
  (`useLogout`) sends `DELETE /auth/session`, which revokes the refresh token;
  `/auth/session` accepts nothing else.
- `requireSession` middleware guards `dashboard-layout.tsx` and `onboarding.tsx`
  with a server-side `redirect()` — never a rendered `<Navigate>`.
- The root loader returns `{ user, isAuthenticated }`. Components read auth via
  `useAuth()` (`lib/auth/use-auth.ts`). The loader decides the first render;
  after that the session is the React Query query `authKeys.session()`
  (`GET /api/auth/me`, seeded from the loader). Call `useRefreshSession()` (or
  invalidate that key) after anything that changes the user; signing in/out
  clears the query cache (`useStartSession()` re-runs the root loader and
  navigates with `safeRedirect` — same-site paths only). A 401 from the API
  drops the session and goes to login.
- Local accounts come from the backend's `make seed` (see its README).
- **Invites**: links land on `/invitations/accept#token=…`; accepting needs a
  signed-in account with the invited email (case-insensitive).

### Organizations & permissions

- **Organization setup is on the backend's contract** (`/organizations/…`,
  snake_case DTOs, DRF pages, roles `admin`/`member`): `features/orgs` parses DTOs
  with `lib/schema/organization.schema.ts` into `OrgView` (full profile, archive
  state, `myRole`) plus the legacy `MyOrg` shape the sidebar, switcher and
  feed still read (`toMyOrg`). Vocabularies are the backend's, in
  `data/org-taxonomy.ts`.
- Orgs are scoped by URL: `/o/:slug/...`. The slug is fixed at creation (backend
  slugs end in the org id: `name-<12 chars>`). Build in-org links with
  `useOrgPath()`.
- `routes/o.$slug.tsx` resolves the org **client-side** (`useOrgBySlug` finds the
  slug in my orgs, then loads preferences). Unknown / archived-for-members → the
  not-found panel; archived for admins → read-only banner.
- **Goals and briefs**: an organization picks what it wants to find (`goals`:
  clients, tenders, grants); each worker has one goal. Each goal has a brief:
  the clients brief (`O/client-brief/`: what you sell, who to, signs they need
  you), the tenders brief (`O/tender-brief/`) and the grant preferences
  (`O/preferences/`). They live on the Workers page as one tab per goal
  (`?tab=clients|tenders|preferences`); onboarding's "What you're after" step
  and the setup checklist ask only for the picked goals' briefs.
- **Client leads** are opportunities of type `client` (feed type "Client leads")
  with a `business` record: phone, email, website, socials, rating, the signs it
  needs you and a suggested pitch. Their page shows `BusinessCard`
  (`components/opportunity/business-card.tsx`) instead of the summary, brief and
  proposal; `briefStatus` is `none`. A missing website reads "No website" only
  when the directory lists websites reliably (`completeListing`), never for
  OpenStreetMap.
- **Onboarding** follows the backend's required setup steps (basics → what you do
  → preferences) plus optional invites; the overview then shows the backend's
  setup checklist (`GET …/setup`) for admins, deep-linking into Settings sheets
  via `?edit=` (`lib/org/setup-steps.ts`).
- **Settings › General** tabs: Profile (identity, contact, about, focus areas),
  AI summary (`?tab=ai`, the company dossier: "What the AI knows about you",
  plus what's missing; admins can regenerate), Preferences, Links, Documents
  (in folders — `O/folders/`, each with a name and a purpose agents read;
  `?folder=<id>` opens one; admins create/rename folders, delete empty ones and
  move documents; upload/download through the proxy; each shows its AI
  processing status, with Retry when it failed), Run settings (`?tab=runs`,
  `O/run-settings/`: the org's depth, sources, types and folders for "Run with
  my settings"; admins edit), Access (archive/restore for admins, leave for
  everyone; the last admin can't leave).
- **Company knowledge** (`GET …/dossier`, `POST …/dossier/regenerate`,
  `POST …/documents/:id/reprocess`) is served by the backend's `apps/knowledge`
  under `/organizations`. Documents (`pending` → `processing` → `processed` /
  `failed` / `unsupported`) and the dossier (`generating`) update in background
  jobs, so `useDocuments` / `useDossier` poll every 3 s until they settle.
- `/app` resolves the landing org: a stashed invite (no orgs) → `/invitations/accept`;
  `leadline:lastOrg` if still a membership → first org → invite inbox →
  `/onboarding` (`resolveLandingPath`, `lib/org/last-org.ts`). Invite links land on
  `/invitations/accept#token=…` (token kept in sessionStorage through sign-up).
- Roles are the backend's: `admin` / `member`. `can(role, action, ctx)` in
  `lib/org/can.ts` mirrors the backend so the UI hides controls it would refuse
  (`useOrg().can(...)`); the backend stays the source of truth (agents carry
  `can_manage`). Members manage only agents they own.
- **Team** (`routes/o.$slug.team.tsx`): roster from `GET …/members/` (removed
  members hidden), admins change roles (`PATCH …/members/:id/`) and remove
  members (`DELETE`); you leave via `POST …/leave/`. The backend keeps ≥ 1 admin
  (409 with a `detail`, shown as-is).

### API Layer

- Axios client at `app/lib/api/client.ts` — `baseURL: '/api'` (same origin; the
  browser never calls the backend directly), clears the session on 401, no toast
  coupling.
- Every request goes to our **`/api/*` proxy** (`routes/api.$.ts`), which
  forwards it to `${API_URL}/<path>/` with the user's access token from the
  cookie and returns status + JSON only (never the backend's cookies; `auth/*`
  and dot segments are refused). Errors arrive as `{ detail }` or DRF field maps
  — read them with `extractError` (`lib/utils/extract-error.ts`).
- Org-scoped paths are built with `orgApi(orgId, '/path')`; each feature's
  `queryFn` parses the snake_case DTO into the UI type
  (`lib/schema/backend.schema.ts`, `leadline.schema.ts`, `organization.schema.ts`, …).
- **Automations** (UI name for the backend's agents / `SearchAgent`; code and
  URLs keep `agents`). The org's search settings (run settings, sources,
  folders, preference keywords) always apply; an automation only **adds**
  source types, websites (`links`), types, keywords and folders, and may set its
  own depth. `agent.effective` is the merged scope with each part's origin
  (`organization` / `agent`), shown grey / blue. Settings pages show saved
  values; each section's **Edit** opens a sheet that saves only that section —
  never land on an editable form.
- **Agent runs** execute in a backend worker. The overview's "Search for
  opportunities" opens `RunDialog` (`components/org/run-dialog.tsx`): _Run with
  my settings_ posts no body (the agent's sources/types, the org's depth and
  folders), _Configure this run_ posts the full settings for that run only.
  `useRunAgent` takes `{ agentId, settings? }`; the run page shows the run's
  depth and folders. "Run now" (`useRunAgent`) gets a
  `202` with the queued run, seeds the run cache and opens `/o/:slug/runs/:id`;
  `useRun` polls every 1.5 s while `queued`/`running`. A run has five workflow
  steps with info/warning/error events, every candidate with its score, reasons
  and decision (`added` / `duplicate` / `below_threshold`, threshold 55%), and a
  status (`succeeded` / `partial` / `failed`).
- Integrations are team tools only (Slack, Teams, email digest, Drive, Notion,
  HubSpot, Salesforce, Google Calendar, Zapier); the backend has no integrations
  service yet, so Settings › Integrations is a static "Coming soon" catalog.
  Agents never depend on them.
- **Tests** use MSW (`app/test/msw.ts`, wired in `app/test/setup.ts`, unhandled
  requests fail). Declare the requests a test needs with `server.use(http.get(
'*/api/organizations/:id/…', …))` and answer with the captured backend
  fixtures in `lib/schema/__fixtures__/backend/`.

### Data Fetching

- TanStack Query for all server state
- Feature-based organization: `features/{domain}/queries.ts`, `mutations.ts`, `query-keys.ts`
- DevTools lazy-loaded only in dev mode

### Env Variables

- Validated via Zod schema at `app/lib/env.ts`
- Client-visible vars must be prefixed with `VITE_`
- **Server-only**: `SESSION_SECRET` (read from `process.env` by
  `lib/auth/session.server.ts`, never `VITE_`-prefixed — it must not reach the
  browser). Required in production. `API_URL` (**required**) is the Leadline
  backend base URL; our server calls it for the browser (see Auth).
- Run `leadline_backend` locally (Django + Celery worker) and set `API_URL` in
  `.env` before `pnpm dev`.
- Optional: `VITE_GTAG_ID`, `VITE_SENTRY_DSN`, `VITE_APP_NAME`, `VITE_APP_VERSION`,
  `VITE_SITE_URL`, `VITE_NOINDEX`

### Linting & Formatting

- ESLint 9 flat config (`eslint.config.js`) — not `.eslintrc`
- Plugins: typescript-eslint, react, react-hooks, jsx-a11y, prettier
- Husky + lint-staged for pre-commit hooks
- Unused vars pattern: prefix with `_` (e.g., `_unused`)

### Styling

- Tailwind CSS 4 with `@theme` and `@theme inline` directives
- shadcn/ui components in `app/components/ui/`
- CSS variables defined in `:root` and `.dark` in `app/app.css`
- Path alias: `~/` maps to `./app/`

### Animations

- **Entrances must not hide server-rendered content.** JS animation libraries
  (Framer Motion was removed for this) render their start state (e.g.
  `opacity: 0`) into the SSR HTML, so the page stays blank until JS hydrates —
  and forever if the bundle is slow or fails. Use the CSS utilities in
  `app.css`: `animate-fade-up` (stagger with
  `style={{ '--delay': '0.1s' }}`, distance via `--fade-up-distance`),
  `animate-on-view` (plays as it scrolls in, CSS scroll timelines where
  supported) and `animate-grow-x`. They respect `prefers-reduced-motion`.
  `components/marketing/ssr-visible.test.tsx` guards the landing page.
- Transitions on interaction (hover, open/close) use Tailwind `transition-*`
  and the Radix `data-[state]` animations shadcn ships with.

## SEO Meta Tag Guidelines

All route pages use `generateSEOTags()` from `app/lib/utils/seo.ts` (imported as
`~/lib/utils/seo`) to inject SEO meta tags (title, description, Open Graph,
Twitter Card) via the `meta` export. It returns the array directly —
`export function meta() { return generateSEOTags({...}); }`.

`generateSEOTags` also accepts a **`jsonLd`** key (a structured-data object or
array) that it emits as `<script type="application/ld+json">` tags. Reusable
builders live in `lib/utils/structured-data.ts` (`organizationSchema`,
`websiteSchema`, `breadcrumbSchema`, `softwareApplicationSchema`); the home page
uses them. Pass `noIndex: true` for pages that shouldn't be indexed (auth, etc.).

### Meta Description Rules

- **Keep descriptions under 155 characters** — Google truncates or replaces longer descriptions with auto-generated snippets from page content
- **Use imperative, benefit-driven language** — describe what the page offers, not just what the company does
- **Match visible page content** — Google is more likely to use your meta description if it closely reflects the actual text on the page
- **No duplicate descriptions** — each route must have a unique description

### Meta Title Rules

- **Keep titles under 60 characters** — Google truncates longer titles
- **Format**: `Page Name | Leadline` (`generateSEOTags` appends `| Leadline` when missing)
- **Include primary keyword** near the start of the title

### Verifying SEO Tags

- SSR renders all meta tags in the initial HTML response — verify with: `curl -s https://leadline.example.com | grep 'meta name="description"'`
- After deploying changes, request re-indexing via **Google Search Console** (URL Inspection > Request Indexing)
- Use `robots.txt` and `sitemap.xml` (both configured) to guide crawlers

### `generateSEOTags()` Usage

```ts
export function meta() {
  return generateSEOTags({
    title: 'Page Title | Leadline', // < 60 chars
    description: 'Concise page description under 155 characters.',
    url: '/page-path',
    keywords: 'comma, separated, keywords',
    image: '/optional-image.png', // defaults to the site favicon
    // jsonLd: [organizationSchema(), websiteSchema()], // optional structured data
  });
}
```

## Conventions

- **Imports**: use `~/` alias for app-relative imports
- **Route loaders**: used for SSR meta tags via `generateSEOTags()`
- **Component exports**: default export for route components, named exports for shared components
- **No console.log**: use `console.warn` or `console.error` (eslint rule). The one
  sanctioned exception is the dev-only request log in `lib/api/client.ts` (guarded
  by `isDev`, with an inline `eslint-disable`).
- **File naming**: kebab-case for files, PascalCase for components
- **Tests**: colocated with source (e.g., `query-keys.test.ts`), Vitest globals enabled
- **Zod schemas**: all schemas live in `app/lib/schema/` — never define schemas
  inside components. Wrap the **resolver** there too (`onboardingResolver = zodResolver(onboardingSchema)`)
  and import that, so a form can't pair a schema with the wrong resolver.
- **Readonly props**: all component props must be wrapped with `Readonly<>` (e.g.,
  `({ title, count }: Readonly<MyProps>)`). **Enforced** by the local ESLint rule
  `local/readonly-props` (`eslint-rules/readonly-props.js`) — it errors, not warns.

---

## Forms — React Hook Form + Zod + Reusable Field Components

All forms must use **React Hook Form** with **Zod** validation via `zodResolver`. Use the reusable field components from `app/components/form-fields/` instead of inline `FormField` renders. This ensures consistent error display, label formatting, and form context integration.

### Available field components

| Component           | Import from                | Use for                                           |
| ------------------- | -------------------------- | ------------------------------------------------- |
| `FormTextField`     | `~/components/form-fields` | Text, email, url, date, number inputs             |
| `FormTextareaField` | `~/components/form-fields` | Multi-line text inputs                            |
| `FormNumberField`   | `~/components/form-fields` | Numeric inputs                                    |
| `FormPasswordField` | `~/components/form-fields` | Password inputs                                   |
| `FormPickerField`   | `~/components/form-fields` | **Every** select — single/multi, static or remote |
| `FormTagInputField` | `~/components/form-fields` | Free-form tag / chip inputs                       |

### `FormPickerField` — the one select field

There is a single select field component. It has two independent axes:

- **static** (`options`) vs **remote** (`onSearch(query, signal) => Promise<PickerItem[]>`,
  debounced; the parent owns the fetch and gets an `AbortSignal` for stale ones).
  Remote mode also takes `debounceMs`, `initialItems` and `minSearchLength`.
- **single** (stores one value) vs **multi** (`multi`, stores an array; plus
  `max`, `optionStyle`, `maxVisibleChips`).

`valueAs="number" | "boolean"` coerces the selected string(s) before they reach
form state. Clearing always writes `null` — never `0`/`false`, which would look
like a real value and slip past a `z.number()` required check.

It renders `Picker` (`~/components/ui/picker.tsx`), our own control — **not**
shadcn's "Combobox" recipe, hence the distinct name; `~/components/ui/select.tsx`
is the vendored shadcn primitive and is unrelated. `Picker` also supports chips,
checkbox rows, `readOnly`, and an always-open inline list. When it renders inside
a modal Sheet/Dialog it is deliberately **not portaled**, so the mouse wheel
scrolls its list (a body-portaled popover sits outside the overlay's
`react-remove-scroll` subtree and the wheel is blocked).

### Single-step form pattern

```tsx
import { useForm } from 'react-hook-form';
import { Form } from '~/components/ui/form';
import { FormTextField, FormTextareaField } from '~/components/form-fields';
// Resolver is wrapped next to the schema (see Conventions) and imported:
import { myResolver } from '~/lib/schema';

const form = useForm<MyInput>({
  resolver: myResolver,
  defaultValues: { name: '', description: '' },
});

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormTextField control={form.control} name="name" label="Name" required />
      <FormTextareaField
        control={form.control}
        name="description"
        label="Description"
      />
    </form>
  </Form>
);
```

### Composed components — one import, slots (`~/components/composed`)

Pages don't assemble shadcn primitives (`Card*`, `Sheet*`, `Dialog*`,
`DropdownMenu*`, `Tabs*`). Import the composed wrappers instead:

| Component     | Slots / props                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------ |
| `AppCard`     | `title`, `description`, `actions` (top-right), `footer`, `children`                              |
| `AppSheet`    | `title`, `description`, `icon`, `children` (scrolls), **sticky `footer`**, `size`, `dismissible` |
| `AppDialog`   | `title`, `description`, `children`, `footer`, `dismissible`                                      |
| `AppDropdown` | `items` (data list incl. `'separator'`), `label`; default trigger is a "⋯" button                |
| `AppTabs`     | `tabs` (`{ value, label, count?, content }`), `variant: 'pill' \| 'underline'`, `actions`        |
| `useConfirm`  | re-exported: promise-based confirm (never `window.confirm`)                                      |

- **Prefer `AppSheet` over dialogs for forms** — it's full-width on mobile, the
  body scrolls, and the action bar stays pinned at the bottom (buttons stack
  full-width on mobile). Submit a form in the body with
  `<form id="x">` + `<Button type="submit" form="x">` in the `footer`.
- Pass `dismissible={!form.formState.isDirty}` on form sheets: Escape and clicking
  outside close an untouched sheet, but can't discard changes once there are some.
  Cancel and the close button always work.
- Current sheets: automation create (`?new` on the agents page), automation
  settings sections (`?tab=settings&edit=<section>` on its page),
  invite members, org profile/focus edit.
- Page-level section tabs (Team, General settings) use `variant="underline"`
  and keep the active tab in `?tab=` so it's linkable.

### Page layout standards

One frame for every dashboard page (references: Deel, Snowflake detail
headers; Typeform, Klarna empty states; Jobber, Wix dashboards on Mobbin):

- **`Page`** (`components/dashboard/page.tsx`) wraps every page: `width`
  `narrow` (3xl: forms, settings, account, proposals), default (6xl: lists,
  details, overview) or `wide` (7xl: the opportunities table); padding
  `px-4 py-6 sm:px-6 lg:py-8`. No hand-rolled `mx-auto max-w-* p-*`.
- **`PageHeader`** is the only page header: optional `back` link, `title`,
  `meta` line (status badges, schedule, timing), `description`, `actions`
  (they wrap under the title on narrow screens).
- **`EmptyState`** (title, one line of guidance, one action) and
  **`PageLoader`**: never copy the dashed box or the spinner markup.
- Type: page title `text-2xl font-semibold tracking-tight`; card titles come
  from `AppCard`; body `text-sm`; meta and labels `text-xs text-muted-foreground`
  in **sentence case** — no `uppercase tracking-*` labels.
- Sections on a page stack with `space-y-6`; grids use `gap-6` (`gap-3`/`gap-4`
  for tiles).
- Settings show saved values; edits happen in a sheet (see Forms).

### Slugs

Organization slugs are **auto-generated** from the name (`lib/utils/slugify.ts`,
`slugify` / `uniqueSlug`) at the API boundary — forms never ask for a slug.

### Multi-step form pattern

For multi-step forms, use `MultiStepForm` from `~/components/ui/multi-step-form` inside a `<Form>` provider. Each step component uses `useFormContext` and registers its own validator via `useStepValidator`.

```tsx
// Route component
<Form {...form}>
  <MultiStepForm steps={steps} onSubmit={() => form.handleSubmit(handler)()}>
    {(step) => {
      switch (step.key) {
        case 'basic': return <StepBasicInfo />;
        case 'review': return <StepReview />;
      }
    }}
  </MultiStepForm>
</Form>

// Step component
function StepBasicInfo() {
  const { control, trigger, formState } = useFormContext<MyFormValues>();

  useStepValidator(async () => {
    const fields = ['name', 'description'] as const;
    const valid = await trigger([...fields]);
    if (valid) return { valid: true };
    const errors: Record<string, string> = {};
    for (const key of fields) {
      const err = formState.errors[key];
      if (err?.message) errors[key] = String(err.message);
    }
    return { valid: false, errors };
  });

  return (
    <>
      <FormTextField control={control} name="name" label="Name" required />
      <FormPickerField control={control} name="country" label="Country" options={...} />
    </>
  );
}
```

**Key rules:**

- Never use raw `useState` for form data — always use `useForm`
- Never write inline `FormField` + `FormItem` + `FormControl` + `FormMessage` — use the field components
- For selects with numeric IDs, keep them as strings in the form schema and coerce to numbers on submit via `createDatasetSchema.parse(data)`
- `MultiStepForm` supports `renderHeader` and `renderFooter` props that receive a `StepNavigation` context for custom stepper/navigation UI

---

## File Uploads — `useFileUpload` hook + `DropZone`

Use the `useFileUpload` hook (`app/hooks/use-file-upload.ts`) for all file upload state management. It pairs directly with the `DropZone` component (`app/components/ui/drop-zone.tsx`).

**Reference consumer: organization logo** (`app/components/org/org-profile-fields.tsx`, `OrgBasicsFields`) — single file, `output: 'base64'`, 512 KB cap, synced into the form with `setValue('logoUrl', …)`.

### Hook options

| Option         | Type                             | Default             | Description                                           |
| -------------- | -------------------------------- | ------------------- | ----------------------------------------------------- |
| `multiple`     | `boolean`                        | `false`             | Single file or multiple files mode                    |
| `output`       | `'file' \| 'base64' \| 'blob'`   | `'file'`            | Data format stored in `ManagedFile.data`              |
| `preview`      | `boolean`                        | `false`             | Generate object URL previews for images               |
| `maxFiles`     | `number`                         | `1` / `10`          | Max files (defaults depend on `multiple`)             |
| `maxSizeBytes` | `number`                         | `100 * 1024 * 1024` | Max file size in bytes                                |
| `accept`       | `string[]`                       | —                   | MIME types or extensions (e.g. `[".pdf", "image/*"]`) |
| `onFileChange` | `(files: ManagedFile[]) => void` | —                   | Fires on every add/remove/clear                       |

### Single-file mode

```tsx
const { file, addFiles, remove, error } = useFileUpload({
  output: 'base64',
  preview: true,
  accept: ['image/*'],
});

<DropZone onFiles={addFiles} accept="image/*" multiple={false} />;
{
  file?.preview && <img src={file.preview} alt={file.name} />;
}
```

### Multiple-file mode

```tsx
const { files, addFiles, remove, clear, getData, error } = useFileUpload({
  multiple: true,
  output: 'base64',
  preview: true,
  maxFiles: 5,
  maxSizeBytes: 20 * 1024 * 1024,
  accept: ['.pdf', '.csv', 'image/*'],
  onFileChange: (newFiles) => {
    form.setValue(
      'attachments',
      newFiles.map((f) => f.data as string)
    );
  },
});

<DropZone
  onFiles={addFiles}
  accept=".pdf,.csv,image/*"
  hint="Max 20 MB per file"
/>;

{
  files.map((f) => (
    <div key={f.key}>
      {f.preview && <img src={f.preview} alt={f.name} />}
      <span>
        {f.name} ({f.size} bytes)
      </span>
      <button onClick={() => remove(f.key)}>Remove</button>
    </div>
  ));
}
```

### Return shape

**Single mode** (`multiple: false`): `file`, `files`, `addFiles`, `remove`, `clear`, `getData`, `error`, `isProcessing`, `clearError`

**Multiple mode** (`multiple: true`): `files`, `addFiles`, `remove(key)`, `removeAt(index)`, `clear`, `getData`, `error`, `isProcessing`, `clearError`

### Key rules

- `DropZone.onFiles` accepts `FileList | File[] | File` — pass `addFiles` directly, no wrapper needed
- Previews are auto-revoked on remove/clear/unmount — no manual cleanup
- Use `onFileChange` to sync files into React Hook Form via `form.setValue`
- `getData()` returns typed data matching the `output` format (`File`, `string`, or `Blob`)
- Icon-only remove buttons need an `aria-label` (e.g. `Remove ${name}`) — the icon is the only label
- Disable submit while `isProcessing` — base64 reads are async, so the data isn't there yet

## CI/CD Agents

Two workflows — keep it lean. PR checks happen on every PR; releases happen on `main`.

### 1. PR Validation Workflow

**File:** `.github/workflows/main.yml`
**Trigger:** Pull requests targeting `main` or `dev` branches

| Job                 | Description                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Lint Code**       | Checks out code, installs dependencies via `pnpm`, and runs `pnpm lint` (TypeScript type-check + ESLint)       |
| **Security Scan**   | Installs dependencies and runs a production build (`pnpm build`) to verify the project compiles without errors |
| **Unit Tests**      | Runs `pnpm test:run` (Vitest)                                                                                  |
| **PR Notification** | Sends a Slack notification to the `#code-reviews` channel with PR status, branch, and author details           |

### 2. Release (Changesets)

**File:** `.github/workflows/release.yml`
**Trigger:** Push to `main`

Owns versioning, `CHANGELOG.md`, GitHub Releases, and Slack release announcements. Uses [`changesets/action@v1`](https://github.com/changesets/action).

**Flow:**

1. On push to `main`, the action checks for pending `.changeset/*.md` files.
2. If pending changesets exist → opens (or updates) a single "Version Packages" PR that bumps `package.json`, rewrites `CHANGELOG.md`, and deletes consumed changeset files.
3. When that PR merges → the same workflow tags `vX.Y.Z`, creates a GitHub Release, and posts to Slack (`#releases`).

The full contributor guide lives in [`RELEASE.md`](../RELEASE.md). Contributors add a changeset with `pnpm changeset` on each user-visible PR; the workflow handles everything else.

## Local Agents

### Pre-commit Hooks (Husky + lint-staged)

**Config:** `.husky/pre-commit`

Runs lint-staged on every commit to automatically lint and format staged files before they are committed. This ensures code quality standards are enforced locally before reaching CI.

### Changesets CLI

**Commands:** `pnpm changeset`, `pnpm changeset:status`, `pnpm changeset:version`

Used to record user-visible changes intent files in `.changeset/`. The release workflow consumes them on `main`; locally you'll typically only run `pnpm changeset` to add one for your PR. See [`RELEASE.md`](../RELEASE.md) for the full flow.

## Agent Summary

| Agent            | Scope                        | When               |
| ---------------- | ---------------------------- | ------------------ |
| PR Validation    | Lint + Build + Tests + Slack | PR to `main`/`dev` |
| Release          | Version + GH Release + Slack | Push to `main`     |
| Husky pre-commit | Lint staged files            | Every local commit |

---

## useEffectEvent for Effects with Latest Values

Use `useEffectEvent` (React 19) when an effect needs to read the latest state/props without re-triggering. This replaces ref-based workarounds and avoids stale closures.

**Why:** Prevents unnecessary effect re-runs while still reading fresh values. The callback always sees the latest render values, and the effect only re-synchronizes on its actual dependencies.

**Pattern:**

```ts
const onDialogOpened = useEffectEvent((entity: Entity | null) => {
  if (!entity) return; // early return offloads conditions from useEffect
  form.reset({ name: entity.name });
  setPreview(entity.image_url);
});

useEffect(() => {
  if (isOpen && isEditing) {
    onDialogOpened(entity); // pass data as args
  }
}, [isOpen, isEditing, entity]);
```

**Rules:**

- Only call from inside `useEffect`, never during render
- Do NOT add to dependency arrays
- Use early returns inside the callback

---

## Styling — `cn()` Utility

For conditional or merged class names, always use `cn()` from `~/lib/utils`:

```ts
import { cn } from '~/lib/utils';
// Merge base classes with conditional and override classes
cn('base-class', isActive && 'active-class', className);
```

Never use string concatenation or template literals for conditional Tailwind classes.

---

## Browser Automation with Playwright MCP

The Playwright MCP server is configured in `.mcp.json` at project root:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": { "BROWSER": "chromium" }
    }
  }
}
```

### Workflow

1. **Navigate** — Use `browser_navigate` to open pages (`http://localhost:5173/...`)
2. **Inspect** — Use `browser_snapshot` to get the page's accessibility tree (element refs, text, structure)
3. **Interact** — Use `browser_click`, `browser_type`, `browser_fill_form` with element `ref` from snapshots
4. **Screenshot** — Use `browser_take_screenshot` to capture visual state
5. **Close** — Use `browser_close` to reset browser state if file chooser modals or other state gets stuck

### Screenshot Convention

Store screenshots in `.playwright-mcp/screenshots/` grouped by page:

```
.playwright-mcp/screenshots/
├── landing/
│   ├── mobile-375.png
│   ├── tablet-768.png
│   └── desktop-1440.png
├── auth/
├── onboarding/
├── overview/
├── opportunities/
├── agents/
├── settings/
└── <page-name>/
    └── ...
```

### Responsive Testing Viewports

| Device  | Width | Height |
| ------- | ----- | ------ |
| Mobile  | 375   | 812    |
| Tablet  | 768   | 1024   |
| Desktop | 1440  | 900    |

Use `browser_resize` before taking screenshots at each viewport.

### Known Limitations

- **File chooser dialogs:** Clicking a file upload button opens a native OS file picker, which Playwright cannot drive. Prefer `browser_file_upload` over clicking the control; if stuck, `browser_close` to reset and `browser_navigate` to re-open the page.
  - This entry used to say pickers "queue up" and blamed Playwright. They queued because `DropZone` nested its `<input>` inside the `<button>` that clicked it, so `inputRef.current.click()` bubbled back into the button's own `onClick` and re-opened the chooser on every click. That was our bug, fixed in `ui/drop-zone.tsx` — not a tool limitation.
- **Snapshot vs Screenshot:** `browser_snapshot` returns the accessibility tree (needed to get element refs for interaction). `browser_take_screenshot` returns a visual image (for review only, can't interact based on it).

---

## Contribution Guide

See `CONTRIBUTING.md` for the full guide. Key points below.

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body> (optional)

<footer> (optional)
```

**Types:**

| Type       | Description                                     | Example                                        |
| ---------- | ----------------------------------------------- | ---------------------------------------------- |
| `feat`     | New feature                                     | `feat(agents): add run history`                |
| `fix`      | Bug fix                                         | `fix(auth): resolve token refresh loop`        |
| `docs`     | Documentation only                              | `docs: update API client usage in README`      |
| `style`    | Formatting, missing semicolons (no code change) | `style: fix indentation in layout`             |
| `refactor` | Code change that neither fixes nor adds         | `refactor(store): simplify auth slice logic`   |
| `test`     | Adding or updating tests                        | `test(members): add invite hook tests`         |
| `chore`    | Build, tooling, CI, dependencies                | `chore: update eslint config`                  |
| `perf`     | Performance improvement                         | `perf(queries): reduce opportunity re-renders` |
| `ci`       | CI/CD configuration                             | `ci: add preview deploy workflow`              |
| `revert`   | Revert a previous commit                        | `revert: revert feat(agents) commit abc1234`   |

**Scopes:** `orgs`, `members`, `agents`, `opportunities`, `integrations`, `auth`, `ui`, `forms`, `store`, `api`, `routes`, `config`. Scope is optional but encouraged.

**Subject rules:**

- Lowercase, imperative mood, no period, max 72 characters
- Good: `feat(agents): add run history`
- Bad: `feat(agents): Added run history.`

**Breaking changes:** Add `!` after type or `BREAKING CHANGE:` in footer:

```
feat(api)!: change pagination response format

BREAKING CHANGE: PaginatedResponse now uses `items` instead of `data`
```

### Branch Naming

Use the format: `<type>/<short-description>`

```
feat/agent-run-history
fix/auth-redirect-loop
chore/update-dependencies
refactor/simplify-table-filters-slice
```

### PR Title

Follow the same commit message format:

```
feat(agents): add run history
fix(auth): resolve token refresh loop
```

### Before Pushing

```bash
pnpm lint:fix && pnpm typecheck
```
