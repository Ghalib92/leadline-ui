import { index, route } from '@react-router/dev/routes';

/** Routes inside the authenticated dashboard shell. */
export const orgRoutes = [
  route('app', 'routes/app.tsx'),
  route('account', 'routes/account.tsx'),
  route('invitations', 'routes/invitations.tsx'),
  route('o/:slug', 'routes/o.$slug.tsx', [
    index('routes/o.$slug._index.tsx'),
    route('opportunities', 'routes/o.$slug.opportunities.tsx'),
    route('opportunities/:id', 'routes/o.$slug.opportunities.$id.tsx'),
    route(
      'opportunities/:id/proposal',
      'routes/o.$slug.opportunities.$id.proposal.tsx'
    ),
    route('outreach', 'routes/o.$slug.outreach.tsx'),
    route('calendar', 'routes/o.$slug.calendar.tsx'),
    route('team', 'routes/o.$slug.team.tsx'),
    route('agents', 'routes/o.$slug.agents.tsx'),
    route('agents/:id', 'routes/o.$slug.agents.$id.tsx'),
    route('runs', 'routes/o.$slug.runs.tsx'),
    route('runs/:id', 'routes/o.$slug.runs.$id.tsx'),
    route('settings/general', 'routes/o.$slug.settings.general.tsx'),
    route('settings/members', 'routes/o.$slug.settings.members.tsx'),
    route('settings/integrations', 'routes/o.$slug.settings.integrations.tsx'),
  ]),
];
