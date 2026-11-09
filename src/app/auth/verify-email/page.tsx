import { AuthCard } from '@/components/auth-card';
import { VerifyEmailForm } from '@/components/verify-email-form';
import { requestVerification } from './actions';
export const metadata = {
  title: 'Check your email | CS-GAMUERS',
  robots: { index: false, follow: false },
};
export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <VerifyEmailForm resend={requestVerification} />
    </AuthCard>
  );
}
