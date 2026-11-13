---
'leadline-ui': minor
---

Sign in with the Leadline backend. Set the server-only `API_URL` (e.g. `http://127.0.0.1:8000/api/v1`) to use it; leave it unset and the app runs on the in-browser mock as before.

- **Accounts on the backend:** sign-up confirms your email with a 6-digit code (new verify-email page, with "send a new one"); signing in with an unverified email takes you there. Password reset uses the emailed code instead of a link.
- **Tokens never reach the browser:** access and refresh tokens are kept in the httpOnly session cookie. The server refreshes them, and signing out revokes them on the backend.
- **Session stays fresh:** the signed-in user is now a query you can reload anywhere with `useRefreshSession()`. Profile edits show up immediately.
- **Ready for more of the backend:** the browser only talks to our own server; a same-origin `/api/*` proxy forwards the domains listed in `lib/api/routing.ts` to the backend, while everything else stays on the mock.

**Breaking:** `VITE_API_BASE_URL` and `VITE_USE_MOCK_API` are removed — use `API_URL`.
