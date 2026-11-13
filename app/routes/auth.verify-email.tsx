import { generateSEOTags } from '~/lib/utils/seo';
import { VerifyEmailForm } from '~/components/forms';

export function meta() {
  return generateSEOTags({
    title: 'Verify Your Email | Leadline',
    description:
      'Enter the code from your email to finish creating your Leadline account.',
    url: '/auth/verify-email',
    noIndex: true,
  });
}

export default function VerifyEmailPage() {
  return <VerifyEmailForm />;
}
