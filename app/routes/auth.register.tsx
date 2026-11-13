import { generateSEOTags } from '~/lib/utils/seo';
import { RegisterForm } from '~/components/forms';

export function meta() {
  return generateSEOTags({
    title: 'Create an Account | Leadline',
    description:
      'Create a free Leadline account and let AI agents find grants, tenders and partners.',
    url: '/auth/register',
    noIndex: true,
  });
}

export default function RegisterPage() {
  return <RegisterForm />;
}
