---
'leadline-ui': minor
---

Turn the task-board template into **Leadline**: AI agents that find grants, tenders, partnerships and events for organizations.

- **Marketing & auth:** new landing and about pages; split-screen sign-in, sign-up, forgot/reset password and invite acceptance.
- **Sessions:** signed, httpOnly session cookie holding only the API token, read by React Router middleware (replaces redux-persist). Set `SESSION_SECRET` in production.
- **Organizations:** onboarding wizard, org-scoped dashboard at `/o/:slug`, org switcher, owner/admin/member roles, members and invitations (with a personal invitations inbox), general settings.
- **Agents & opportunities:** agents with built-in sources, a scored opportunities feed with filters, and agent run history with a live workflow view showing warnings, errors and every matching decision.
- **Integrations:** team tools (Slack, Teams, email digest, Drive, Notion, HubSpot, Salesforce, Google Calendar, Zapier).
- **UI building blocks:** slot-based `AppCard`, `AppSheet` (sticky actions), `AppDialog`, `AppDropdown`, `AppTabs`.
- **Platform:** React 19.3, React Router 8 (Node ≥ 22.22), ESLint plugins bumped, SonarQube removed from CI.
