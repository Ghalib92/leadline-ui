---
'leadline-ui': minor
---

Organization setup runs on the Leadline backend (and on a mock that mirrors it when `API_URL` is unset).

- **Joining by invitation skips "create organization":** invitation emails land on `/invitations/accept`, the link survives sign-up and the email code, and you land in the organization. Creating your own stays one click away.
- **Onboarding follows the backend's setup steps** — type, country and description; what you do; what you're looking for — then optional invites. The overview shows the backend's setup checklist until it's done.
- **Richer organization profile:** legal details, contact and location, mission, vision, programs, beneficiaries, track record, past funders, SDGs, countries and languages.
- **Opportunity preferences:** 16 opportunity types, geographic scope, regions and countries, keywords to seek or avoid, preferred funders, eligibility, funding range and currency.
- **Links and documents:** add your website and profiles; upload, download, edit and delete documents (up to 25 MB).
- **Archive / restore / leave** replace delete; the last admin can't leave.
- **Accounts:** first and last name, change email (re-verify the new address).
- Every input has a placeholder and an `autocomplete` token.
