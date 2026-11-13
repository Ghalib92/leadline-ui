---
'leadline-ui': minor
---

Run the whole opportunity pipeline on the Leadline backend.

- **Search for opportunities** (Overview): one click runs your agent (or creates one from your preferences) and opens the run live — each step, the sources searched, the pages read with links, scores, and counts as they happen. Partial runs say why they stopped.
- **Agents, runs, opportunities and the overview** use the backend when `API_URL` is set (the mock still serves them otherwise).
- **Review**: Approve or Reject (with a reason and a comment) on each opportunity; decisions are listed on the page, the feed shows what is awaiting review and filters "To review". Approving starts the Proposal Writer.
- **Proposal editor**: watch the draft being written, read each section with its evidence citations and [TODO] markers, edit or rewrite a section with AI, see readiness and what the call asks for, restore versions and export to Word.
- **Contacts & outreach**: find a funder's contacts (lead scout), add your own, draft emails with AI; admins approve each email before it is sent (Outreach page).
- **Deadlines**: a calendar of what you are pursuing, "Add to calendar" (.ics) downloads, and your email reminder settings.
- **Insights** on the overview: searches per week, what was found by type, score and source, approval rate and rejection reasons.
