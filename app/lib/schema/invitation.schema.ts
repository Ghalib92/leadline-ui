import { z } from 'zod';
import type { Invite } from './member.schema';

/**
 * The invitee's view of an invitation — the backend's
 * `POST /organizations/invitations/preview/` shape, camelCased at the edge.
 */
export const invitationPreviewSchema = z
  .object({
    id: z.string(),
    organization: z.string(),
    organization_name: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'member']),
    message: z.string().default(''),
    invited_by_name: z.string(),
    status: z.enum(['pending', 'accepted', 'declined', 'revoked', 'expired']),
    expires_at: z.string(),
  })
  .transform((v) => ({
    id: v.id,
    organizationId: v.organization,
    organizationName: v.organization_name,
    email: v.email,
    role: v.role,
    message: v.message,
    invitedByName: v.invited_by_name,
    status: v.status,
    expiresAt: v.expires_at,
  }));

/** `POST /organizations/invitations/accept/` → the new membership. */
export const acceptedMembershipSchema = z
  .object({ organization: z.string(), role: z.string(), status: z.string() })
  .transform((v) => ({ organizationId: v.organization }));

export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;

/**
 * The admin's view of an invitation (`InvitationSerializer`), mapped to the
 * `Invite` shape the Team page uses. The backend never returns the token —
 * it only travels in the email — so there's no copyable link.
 */
export const orgInvitationDtoSchema = z
  .object({
    id: z.string(),
    organization: z.string(),
    email: z.string(),
    role: z.enum(['admin', 'member']),
    invited_by: z.string().nullable(),
    status: z.enum(['pending', 'accepted', 'declined', 'revoked', 'expired']),
    expires_at: z.string(),
    created_at: z.string(),
  })
  .transform(
    (dto): Invite => ({
      id: dto.id,
      orgId: dto.organization,
      email: dto.email,
      role: dto.role,
      invitedBy: dto.invited_by ?? '',
      status: dto.status,
      createdAt: dto.created_at,
      expiresAt: dto.expires_at,
    })
  );

/** An invitation in my inbox (`GET /organizations/invitations/received/`). */
export const receivedInvitationSchema = z
  .object({
    id: z.string(),
    organization: z.string(),
    organization_name: z.string(),
    role: z.enum(['admin', 'member']),
    message: z.string().default(''),
    invited_by_name: z.string(),
    status: z.enum(['pending', 'accepted', 'declined', 'revoked', 'expired']),
    expires_at: z.string(),
    responded_at: z.string().nullable(),
    created_at: z.string(),
  })
  .transform((v) => ({
    id: v.id,
    organizationId: v.organization,
    organizationName: v.organization_name,
    role: v.role,
    message: v.message,
    invitedByName: v.invited_by_name,
    status: v.status,
    expiresAt: v.expires_at,
    respondedAt: v.responded_at,
    createdAt: v.created_at,
  }));
export type ReceivedInvitation = z.infer<typeof receivedInvitationSchema>;
