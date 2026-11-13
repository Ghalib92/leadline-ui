import { generateSEOTags } from '~/lib/utils/seo';
import { ResetPasswordCodeForm } from '~/components/forms';

export function meta() {
  return generateSEOTags({
    title: 'Choose a New Password | Leadline',
    description: 'Set a new password for your Leadline account.',
    url: '/auth/reset-password',
    noIndex: true,
  });
}

export default function ResetPasswordPage() {
  return <ResetPasswordCodeForm />;
}
