import { generateSEOTags } from '~/lib/utils/seo';
import { LoginForm } from '~/components/forms';

export function meta() {
  return generateSEOTags({
    title: 'Sign In | Leadline',
    description:
      'Sign in to Leadline to review opportunities your AI agents found.',
    url: '/auth/login',
    noIndex: true,
  });
}

export default function LoginPage() {
  return <LoginForm />;
}
