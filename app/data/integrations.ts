import type { Integration } from '~/lib/schema';

/**
 * Static catalog of team tools Leadline will connect to (Settings ›
 * Integrations shows it as "Coming soon"; the backend has no integrations
 * service yet). Discovery runs on built-in sources (`AGENT_SOURCES`), so
 * nothing here is required for agents to work.
 */
export const INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Post high-match opportunities and deadline reminders to a channel.',
    category: 'notify',
    authType: 'oauth',
    features: [
      'Post new matches above your score threshold to a channel',
      'Send deadline reminders 7 and 2 days before closing',
    ],
  },
  {
    id: 'microsoft-teams',
    name: 'Microsoft Teams',
    description:
      'Share new opportunities and deadlines with your team in Teams.',
    category: 'notify',
    authType: 'oauth',
    features: [
      'Post new matches to a Teams channel',
      'Send deadline reminders to the channel',
    ],
  },
  {
    id: 'email-digest',
    name: 'Email digest',
    description: 'A weekly summary of new matches in every member’s inbox.',
    category: 'notify',
    authType: 'none',
    features: [
      'Email each member a Monday summary of new matches',
      'Include upcoming deadlines for opportunities you’re pursuing',
    ],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Save opportunity briefs and keep proposals next to the call.',
    category: 'storage',
    authType: 'oauth',
    features: [
      'Create a folder per opportunity you pursue',
      'Save a PDF brief of each opportunity',
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Mirror your leadline pipeline to a Notion database.',
    category: 'storage',
    authType: 'oauth',
    features: [
      'Create a page for each opportunity you pursue',
      'Keep status and deadline in sync',
    ],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Track funders and partners as companies and deals.',
    category: 'crm',
    authType: 'api_key',
    features: [
      'Create a company for each new funder',
      'Open a deal when an opportunity moves to Pursuing',
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Log funders and pursued opportunities in your CRM.',
    category: 'crm',
    authType: 'oauth',
    features: [
      'Create accounts for funders',
      'Create opportunities when you start pursuing',
    ],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Put application deadlines on your team calendar.',
    category: 'calendar',
    authType: 'oauth',
    features: [
      'Add an event for each deadline you’re pursuing',
      'Update the event if the deadline changes',
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Send new matches to 6,000+ apps with no code.',
    category: 'automation',
    authType: 'api_key',
    features: [
      'Trigger a Zap for every new match',
      'Trigger a Zap when an opportunity changes status',
    ],
  },
];
