import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

/** Backend `profile.first_name` / `last_name` (≤ 100 chars each). */
const firstName = z
  .string()
  .trim()
  .min(1, 'Enter your first name')
  .max(100, 'Keep it under 100 characters');
const lastName = z.string().trim().max(100, 'Keep it under 100 characters');

/** Display name from its parts. */
export const fullName = (first: string, last: string) =>
  `${first.trim()} ${last.trim()}`.trim();

export const authUserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  /** Not every backend response includes it (the session payload doesn't). */
  createdAt: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    firstName,
    lastName,
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    /** Business sign-ups only: prefills setup; never sent with the account. */
    businessName: z.string().trim().max(200).optional(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address'),
});

const newPassword = z.string().min(8, 'Password must be at least 8 characters');

/** The 6-digit code emailed after sign-up. */
const otpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code from the email');

export const verifyEmailSchema = z.object({
  email: z.email('Enter a valid email address'),
  code: otpCode,
});

/** Reset with the emailed code. */
export const resetPasswordWithCodeSchema = z
  .object({
    email: z.email('Enter a valid email address'),
    code: otpCode,
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/** The new address must be verified; every session ends. */
export const changeEmailSchema = z.object({
  newEmail: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your current password'),
});

/** Deleting the account asks for the password once more. */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password'),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password'),
    next: newPassword,
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export const updateProfileSchema = z.object({ firstName, lastName });

/**
 * Resolvers are wrapped here, next to the schema, so a form imports one thing
 * and no call site can pair a schema with the wrong resolver.
 */
export const loginResolver = zodResolver(loginSchema);
export const registerResolver = zodResolver(registerSchema);
export const forgotPasswordResolver = zodResolver(forgotPasswordSchema);
export const verifyEmailResolver = zodResolver(verifyEmailSchema);
export const resetPasswordWithCodeResolver = zodResolver(
  resetPasswordWithCodeSchema
);
export const changeEmailResolver = zodResolver(changeEmailSchema);
export const deleteAccountResolver = zodResolver(deleteAccountSchema);
export const changePasswordResolver = zodResolver(changePasswordSchema);
export const updateProfileResolver = zodResolver(updateProfileSchema);

export type AuthUser = z.infer<typeof authUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordWithCodeInput = z.infer<
  typeof resetPasswordWithCodeSchema
>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
