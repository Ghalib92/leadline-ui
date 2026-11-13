import { route } from '@react-router/dev/routes';

export const authRoutes = [
  route('auth/login', 'routes/auth.login.tsx'),
  route('auth/register', 'routes/auth.register.tsx'),
  route('auth/forgot-password', 'routes/auth.forgot-password.tsx'),
  route('auth/reset-password', 'routes/auth.reset-password.tsx'),
  route('auth/verify-email', 'routes/auth.verify-email.tsx'),
  route('invitations/accept', 'routes/invitations.accept.tsx'),
  route('invite/:token', 'routes/invite.$token.tsx'),
];
