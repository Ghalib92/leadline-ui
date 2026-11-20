import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { ArrowRight, Mail, Monitor, Plus } from 'lucide-react';
import {
  changeEmailResolver,
  changePasswordResolver,
  updateProfileResolver,
  type ChangeEmailInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '~/lib/schema';
import {
  applyFieldErrors,
  useChangeEmail,
  useChangePassword,
  useLogout,
  useUpdateProfile,
  verifyEmailPath,
} from '~/features/auth';
import { useMyOrgs } from '~/features/orgs';
import { usePendingInvitations } from '~/features/invitations';
import { useAuth } from '~/lib/auth/use-auth';
import { formatDate, initials } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { AppCard, AppSheet, AppTabs } from '~/components/composed';
import { FormPasswordField, FormTextField } from '~/components/form-fields';
import { Page } from '~/components/dashboard/page';
import { workspaceRole } from '~/components/dashboard/org-switcher';
import { DeleteAccountCard } from '~/components/account/delete-account-card';

export function meta() {
  return generateSEOTags({
    title: 'Account | Leadline',
    description: 'Your Leadline profile, sign-in and workspaces.',
    url: '/account',
    noIndex: true,
  });
}

/** Label/value row with an optional action, ElevenLabs-style. */
function Row({
  label,
  value,
  action,
}: Readonly<{ label: string; value: ReactNode; action?: ReactNode }>) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <div className="mt-0.5 truncate text-sm text-muted-foreground">
          {value}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type Editing = 'profile' | 'email' | 'password' | null;

export default function AccountPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'profile';
  const [editing, setEditing] = useState<Editing>(null);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const changeEmail = useChangeEmail();
  const logout = useLogout();
  const { data: orgs = [] } = useMyOrgs();
  // Someone who only looks for a job: no talk of organizations and roles.
  const onlyJobSearch =
    orgs.length > 0 && orgs.every(({ org }) => org.isCandidate);
  const { data: invites = [] } = usePendingInvitations();

  const profileForm = useForm<UpdateProfileInput>({
    resolver: updateProfileResolver,
    defaultValues: { firstName: '', lastName: '' },
  });
  const emailForm = useForm<ChangeEmailInput>({
    resolver: changeEmailResolver,
    defaultValues: { newEmail: '', password: '' },
  });
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: changePasswordResolver,
    defaultValues: { current: '', next: '', confirm: '' },
  });

  const openProfile = () => {
    profileForm.reset({
      firstName: user?.firstName ?? user?.name ?? '',
      lastName: user?.lastName ?? '',
    });
    setEditing('profile');
  };
  const openEmail = () => {
    emailForm.reset({ newEmail: '', password: '' });
    setEditing('email');
  };
  const openPassword = () => {
    passwordForm.reset({ current: '', next: '', confirm: '' });
    setEditing('password');
  };

  const saveProfile = async (data: UpdateProfileInput) => {
    try {
      await updateProfile.mutateAsync(data);
      toastUtils.success('Profile saved');
      setEditing(null);
    } catch (error) {
      toastUtils.error('Could not save', extractError(error));
    }
  };

  const saveEmail = async (data: ChangeEmailInput) => {
    try {
      const { email } = await changeEmail.mutateAsync(data);
      toastUtils.success('Check your new inbox', 'Enter the code we sent.');
      // Full load: the session cookie is gone, so the root loader must re-run.
      globalThis.location.assign(
        verifyEmailPath(email ?? data.newEmail, '/account')
      );
    } catch (error) {
      applyFieldErrors(error, emailForm.setError);
      toastUtils.error('Could not change email', extractError(error));
    }
  };

  const savePassword = async (data: ChangePasswordInput) => {
    try {
      await changePassword.mutateAsync(data);
      toastUtils.success('Password changed');
      setEditing(null);
    } catch (error) {
      toastUtils.error('Could not change password', extractError(error));
    }
  };

  const editButton = (label: string, onClick: () => void) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="w-full sm:w-auto"
    >
      {label}
    </Button>
  );

  return (
    <Page width="narrow">
      {/* Identity header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {initials(user?.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {user?.name ?? 'Your account'}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {user?.email}
            {user?.createdAt && ` · Member since ${formatDate(user.createdAt)}`}
          </p>
        </div>
        <Button variant="outline" onClick={openProfile} disabled={!user}>
          Edit profile
        </Button>
      </div>

      <div className="mt-8">
        <AppTabs
          variant="underline"
          value={tab}
          onValueChange={(value) =>
            setSearchParams(value === 'profile' ? {} : { tab: value }, {
              replace: true,
            })
          }
          tabs={[
            {
              value: 'profile',
              label: 'Profile',
              content: (
                <AppCard contentClassName="divide-y divide-border py-0">
                  <Row
                    label="Full name"
                    value={user?.name ?? '—'}
                    action={editButton('Change name', openProfile)}
                  />
                  <Row
                    label="Email address"
                    value={
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {user?.email ?? '—'}
                      </span>
                    }
                    action={editButton('Change email', openEmail)}
                  />
                  <Row
                    label="Member since"
                    value={user?.createdAt ? formatDate(user.createdAt) : '—'}
                  />
                </AppCard>
              ),
            },
            {
              value: 'security',
              label: 'Security',
              content: (
                <div className="space-y-4">
                  <AppCard contentClassName="divide-y divide-border py-0">
                    <Row
                      label="Password"
                      value="••••••••••"
                      action={editButton('Change password', openPassword)}
                    />
                    <Row
                      label="Password reset"
                      value="Forgot it? We’ll email you a reset code."
                      action={
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="w-full sm:w-auto"
                        >
                          <Link to="/auth/forgot-password">
                            Send reset code
                          </Link>
                        </Button>
                      }
                    />
                  </AppCard>
                  <AppCard
                    title="Signed-in sessions"
                    description="Your session is kept in a secure, httpOnly cookie on this device."
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                        <Monitor className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">This browser</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Active now
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => logout.mutate('/')}
                        disabled={logout.isPending}
                        className="w-full sm:w-auto"
                      >
                        Sign out
                      </Button>
                    </div>
                  </AppCard>
                  <DeleteAccountCard
                    description={
                      onlyJobSearch
                        ? 'Deletes your account, your CV, your job searches and every job Leadline found for you.'
                        : 'Deletes your account and every workspace only you use, with its documents. Teams you belong to keep their work.'
                    }
                  />
                </div>
              ),
            },
            {
              value: 'organizations',
              label: 'Workspaces',
              count: orgs.length,
              content: (
                <div className="space-y-4">
                  {invites.length > 0 && (
                    <Link
                      to="/invitations"
                      className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm hover:bg-primary/10"
                    >
                      <span>
                        You have <strong>{invites.length}</strong> pending{' '}
                        {invites.length === 1 ? 'invitation' : 'invitations'}
                      </span>
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </Link>
                  )}
                  <AppCard
                    title="Your workspaces"
                    description={
                      onlyJobSearch
                        ? 'Your job search. Add a business here too if you have one.'
                        : 'Your job search and the businesses or organizations you belong to.'
                    }
                    actions={
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/onboarding">
                          <Plus className="h-4 w-4" /> New
                        </Link>
                      </Button>
                    }
                    contentClassName="divide-y divide-border"
                  >
                    {orgs.length === 0 ? (
                      <p className="py-4 text-sm text-muted-foreground">
                        You haven’t set anything up yet.
                      </p>
                    ) : (
                      orgs.map((entry) => {
                        const { org } = entry;
                        return (
                          <div
                            key={org.id}
                            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                          >
                            {org.logoUrl ? (
                              <img
                                src={org.logoUrl}
                                alt=""
                                className="h-9 w-9 rounded-lg object-cover"
                              />
                            ) : (
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                                {initials(org.name)}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {org.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {workspaceRole(entry)}
                              </p>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/o/${org.slug}`}>Open</Link>
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </AppCard>
                </div>
              ),
            },
          ]}
        />
      </div>

      <AppSheet
        open={editing === 'email'}
        onOpenChange={(open) => !open && setEditing(null)}
        dismissible={false}
        title="Change email"
        description="We’ll sign you out everywhere and email a code to the new address. Sign in again once it’s verified."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="email-form"
              disabled={changeEmail.isPending}
            >
              Change email
            </Button>
          </>
        }
      >
        <Form {...emailForm}>
          <form
            method="post"
            id="email-form"
            onSubmit={emailForm.handleSubmit(saveEmail)}
            className="space-y-4"
          >
            <FormTextField
              control={emailForm.control}
              name="newEmail"
              autoComplete="email"
              placeholder="you@example.org"
              label="New email"
              type="email"
              required
            />
            <FormPasswordField
              control={emailForm.control}
              name="password"
              autoComplete="current-password"
              placeholder="Your current password"
              label="Current password"
              required
            />
          </form>
        </Form>
      </AppSheet>

      <AppSheet
        open={editing === 'profile'}
        onOpenChange={(open) => !open && setEditing(null)}
        dismissible={false}
        title="Edit profile"
        description="How teammates see you."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="profile-form"
              disabled={updateProfile.isPending}
            >
              Save
            </Button>
          </>
        }
      >
        <Form {...profileForm}>
          <form
            method="post"
            id="profile-form"
            onSubmit={profileForm.handleSubmit(saveProfile)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormTextField
                control={profileForm.control}
                name="firstName"
                autoComplete="given-name"
                placeholder="e.g. Amina"
                label="First name"
                required
              />
              <FormTextField
                control={profileForm.control}
                name="lastName"
                autoComplete="family-name"
                placeholder="e.g. Wanjiru"
                label="Last name"
              />
            </div>
          </form>
        </Form>
      </AppSheet>

      <AppSheet
        open={editing === 'password'}
        onOpenChange={(open) => !open && setEditing(null)}
        dismissible={false}
        title="Change password"
        description="Use at least 8 characters."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="password-form"
              disabled={changePassword.isPending}
            >
              Change password
            </Button>
          </>
        }
      >
        <Form {...passwordForm}>
          <form
            method="post"
            id="password-form"
            onSubmit={passwordForm.handleSubmit(savePassword)}
            className="space-y-4"
          >
            <FormPasswordField
              control={passwordForm.control}
              name="current"
              autoComplete="current-password"
              placeholder="Your current password"
              label="Current password"
              required
            />
            <FormPasswordField
              control={passwordForm.control}
              name="next"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              label="New password"
              required
            />
            <FormPasswordField
              control={passwordForm.control}
              name="confirm"
              autoComplete="new-password"
              placeholder="Type the new password again"
              label="Confirm new password"
              required
            />
          </form>
        </Form>
      </AppSheet>
    </Page>
  );
}
