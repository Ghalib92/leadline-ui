import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { roleSchema } from './org.schema';

/** A membership from `GET /organizations/:id/members/`. */
export const memberDtoSchema = z
  .object({
    id: z.string(),
    organization: z.string(),
    user: z.object({
      id: z.string(),
      email: z.string(),
      first_name: z.string().default(''),
      last_name: z.string().default(''),
    }),
    role: roleSchema,
    status: z.enum(['active', 'inactive', 'removed']),
    joined_at: z.string().nullable(),
  })
  .transform((dto) => ({
    id: dto.id,
    orgId: dto.organization,
    userId: dto.user.id,
    email: dto.user.email,
    name:
      `${dto.user.first_name} ${dto.user.last_name}`.trim() || dto.user.email,
    role: dto.role,
    status: dto.status,
    joinedAt: dto.joined_at,
  }));

export const inviteSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  email: z.string(),
  role: roleSchema,
  invitedBy: z.string(),
  status: z.enum(['pending', 'accepted', 'declined', 'revoked', 'expired']),
  createdAt: z.string(),
  expiresAt: z.string(),
  /** When the invitee accepted or declined. */
  respondedAt: z.string().optional(),
});

export const inviteMembersSchema = z.object({
  emails: z
    .array(z.email('Enter valid email addresses'))
    .min(1, 'Add at least one email')
    .max(20, 'Invite up to 20 people at once'),
  role: z.enum(['admin', 'member']),
});

export const inviteResultSchema = z.object({
  created: z.array(inviteSchema),
  skipped: z.array(z.string()),
});

export const updateMemberRoleSchema = z.object({ role: roleSchema });

export const inviteMembersResolver = zodResolver(inviteMembersSchema);

export type Member = z.infer<typeof memberDtoSchema>;
export type Invite = z.infer<typeof inviteSchema>;
export type InviteMembersInput = z.infer<typeof inviteMembersSchema>;
export type InviteResult = z.infer<typeof inviteResultSchema>;
