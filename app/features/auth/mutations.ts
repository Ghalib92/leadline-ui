import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useRevalidator, useSubmit } from 'react-router';
import type { SessionData } from '~/lib/auth/use-auth';
import { authKeys } from './query-keys';
import { postAuth } from './auth-api';
import type {
  AuthUser,
  ChangeEmailInput,
  ChangePasswordInput,
  DeleteAccountInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordWithCodeInput,
  UpdateProfileInput,
  VerifyEmailInput,
} from '~/lib/schema';

/**
 * Finish signing in. The server already put the tokens in the httpOnly
 * cookie, so re-run the root loader and go.
 */
export function useStartSession() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { revalidate } = useRevalidator();
  return async (redirectTo: string) => {
    // A different user may be signing in: drop everything cached for the last one.
    queryClient.clear();
    await revalidate();
    await navigate(redirectTo, { replace: true });
  };
}

/**
 * Reload the signed-in user (and whether the session is still alive) after
 * anything that changes them — e.g. a profile edit made elsewhere.
 */
export function useRefreshSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: authKeys.session() });
}

/** Credentials are checked by the API; the server sets the session cookie. */
export const useLogin = () =>
  useMutation({
    mutationFn: (input: LoginInput) =>
      postAuth<{ user: AuthUser }>('login', input),
  });

/** Sign-up asks for an emailed code before the first sign-in. */
export const useRegister = () =>
  useMutation({
    mutationFn: async (
      input: RegisterInput
    ): Promise<{ verifyEmail: string }> => {
      const { email } = await postAuth<{ email?: string }>('register', input);
      return { verifyEmail: email ?? input.email };
    },
  });

/** `null` user: the email was already verified — sign in instead. */
export const useVerifyEmail = () =>
  useMutation({
    mutationFn: (input: VerifyEmailInput) =>
      postAuth<{ user?: AuthUser; detail?: string }>('verify-email', input),
  });

export const useResendVerification = () =>
  useMutation({
    mutationFn: (email: string) =>
      postAuth<{ detail?: string }>('resend-verification', { email }),
  });

/** Ends the API session, clears cached data, then drops the cookie. */
export const useLogout = () => {
  const queryClient = useQueryClient();
  const submit = useSubmit();

  return useMutation({
    // Nothing to call first: DELETE /auth/session revokes the refresh token
    // and drops the cookie.
    mutationFn: async (redirectTo: string = '/'): Promise<string> => redirectTo,
    onSettled: async (redirectTo) => {
      queryClient.clear();
      // The server also revokes the refresh token here.
      await submit(
        { redirectTo: redirectTo ?? '/' },
        { method: 'delete', action: '/auth/session' }
      );
    },
  });
};

/**
 * Delete the account for good. The server ends the session (the cookie goes
 * with the account), so drop everything cached and go home.
 */
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  return useMutation({
    mutationFn: (input: DeleteAccountInput) =>
      postAuth<{ detail?: string }>('delete-account', input),
    onSuccess: async () => {
      queryClient.clear();
      // Leave the signed-in page first: refreshing it without a session would
      // send them to the sign-in page instead of home.
      await navigate('/', { replace: true });
      await revalidate();
    },
  });
};

export const useForgotPassword = () =>
  useMutation({
    mutationFn: async (input: ForgotPasswordInput): Promise<string> => {
      const { detail } = await postAuth<{ detail?: string }>(
        'forgot-password',
        input
      );
      return detail ?? 'If an account exists, a code is on its way.';
    },
  });

/** Reset with the emailed code; signs the user in. */
export const useResetPasswordWithCode = () =>
  useMutation({
    mutationFn: (input: ResetPasswordWithCodeInput) =>
      postAuth<{ user: AuthUser }>('reset-password', input),
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<AuthUser> =>
      (await postAuth<{ user: AuthUser }>('profile', input)).user,
    onSuccess: (user) =>
      queryClient.setQueryData<SessionData>(authKeys.session(), {
        user,
        isAuthenticated: true,
      }),
  });
};

/**
 * The server ends the session (the backend revoked every token
 * and un-verified the account); the caller sends the user to verify the new
 * address.
 */
export const useChangeEmail = () =>
  useMutation({
    mutationFn: (input: ChangeEmailInput) =>
      postAuth<{ email?: string; detail?: string }>('change-email', input),
  });

// The server stores the rotated tokens.
export const useChangePassword = () =>
  useMutation({
    mutationFn: async (input: ChangePasswordInput): Promise<void> => {
      await postAuth('change-password', input);
    },
  });
