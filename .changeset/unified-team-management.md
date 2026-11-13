---
'leadline-ui': minor
---

Implement **Unified Team Management** combining workspace access with BD intelligence knowledge base.

- **Staff Directory (`/o/:slug/team`)**: searchable team directory with grid cards (`MemberCard`) and compact table views, filter pills for department, role, and availability status.
- **Member Profile & Dossier (`MemberProfileSheet`)**: view full BD profile credentials (bio, verified CV, technical skills, sector experience, certifications, and proposal credits); edit mode with form validation and drag-and-drop CV upload via `DropZone`.
- **BD Capabilities Matrix**: aggregate organizational skill frequency and practice area distribution powering Leadline's Fit Agent capability matching.
- **Seamless Invitations Lifecycle**: integrated with workspace onboarding flow, enabling leads to track pending invitations, copy direct join links, resend, or revoke.
- **Unified Navigation & Responsiveness**: consolidated workspace navigation by removing duplicate Members settings and redirecting to the canonical Team Hub; resolved text overflow and wrapping issues across mobile/tablet viewports.
- **Schemas & Mock API**: extended `memberSchema` with BD credentials, updated mock handlers with role-based access checks, and seeded realistic team credentials across demo accounts.
