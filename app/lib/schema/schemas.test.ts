import { describe, expect, it } from 'vitest';
import {
  agentInputSchema,
  inviteMembersSchema,
  onboardingSchema,
  fullName,
  registerSchema,
  resetPasswordWithCodeSchema,
  updateProfileSchema,
} from '~/lib/schema';

const validProfile = {
  name: 'Kijani Health',
  country: 'KE',
  type: 'ngo',
  size: '11-50',
  sectors: ['health'],
  regions: ['east-africa'],
  opportunityTypes: ['grant'],
};

describe('onboardingSchema', () => {
  it('accepts a complete profile with no invites', () => {
    const result = onboardingSchema.safeParse({
      ...validProfile,
      inviteEmails: [],
      inviteRole: 'member',
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one sector, region and opportunity type', () => {
    const result = onboardingSchema.safeParse({
      ...validProfile,
      sectors: [],
      regions: [],
      opportunityTypes: [],
      inviteEmails: [],
      inviteRole: 'member',
    });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining(['sectors', 'regions', 'opportunityTypes'])
    );
  });

  it('rejects an unknown org type', () => {
    const result = onboardingSchema.safeParse({
      ...validProfile,
      type: 'cooperative',
      inviteEmails: [],
      inviteRole: 'member',
    });
    expect(result.success).toBe(false);
  });
});

describe('inviteMembersSchema', () => {
  it('rejects roles the backend does not have', () => {
    const result = inviteMembersSchema.safeParse({
      emails: ['a@b.co'],
      role: 'owner',
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed emails', () => {
    const result = inviteMembersSchema.safeParse({
      emails: ['not-an-email'],
      role: 'member',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordWithCodeSchema', () => {
  it('requires matching passwords', () => {
    const result = resetPasswordWithCodeSchema.safeParse({
      email: 'a@b.co',
      code: '123456',
      password: 'password123',
      confirmPassword: 'password124',
    });
    expect(result.success).toBe(false);
  });
});

describe('agentInputSchema', () => {
  it('needs at least one source', () => {
    const result = agentInputSchema.safeParse({
      name: 'Health grants',
      opportunityTypes: ['grant'],
      keywords: [],
      sources: [],
      schedule: 'daily',
      enabled: true,
    });
    expect(result.success).toBe(false);
  });
});

describe('name fields', () => {
  const base = {
    email: 'a@b.co',
    password: 'password123',
    confirmPassword: 'password123',
  };
  it('requires a first name, allows an empty last name', () => {
    expect(
      registerSchema.safeParse({ ...base, firstName: '', lastName: '' }).success
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, firstName: 'Amina', lastName: '' })
        .success
    ).toBe(true);
    expect(
      updateProfileSchema.safeParse({
        firstName: 'A'.repeat(101),
        lastName: '',
      }).success
    ).toBe(false);
  });
  it('joins names for display', () => {
    expect(fullName(' Amina ', 'Wanjiru')).toBe('Amina Wanjiru');
    expect(fullName('Amina', '')).toBe('Amina');
  });
});
