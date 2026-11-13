export const invitationKeys = {
  all: ['invitations'] as const,
  preview: (token: string) =>
    [...invitationKeys.all, 'preview', token] as const,
  /** Everything sent to me, past included. */
  received: () => [...invitationKeys.all, 'received'] as const,
};
