import { generateSEOTags } from '~/lib/utils/seo';
import { ForgotPasswordForm } from '~/components/forms';

export function meta() {
  return generateSEOTags({
    title: 'Reset Password | Leadline',
    description: 'Get a link to reset your Leadline password.',
    url: '/auth/forgot-password',
    noIndex: true,
  });
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
