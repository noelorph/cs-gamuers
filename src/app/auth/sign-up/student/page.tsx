import { AuthCard } from '@/components/auth-card';
import { SignUpForm } from '@/components/sign-up-form';
import { submitStudent } from '../actions';
import { requestVerification } from '../../verify-email/actions';
export const metadata = { title: 'Apply as Student | CS-GAMUERS' };
export default function SignUpPage() {
  return (
    <AuthCard>
      <SignUpForm role="student" submit={submitStudent} resend={requestVerification} />
    </AuthCard>
  );
}
