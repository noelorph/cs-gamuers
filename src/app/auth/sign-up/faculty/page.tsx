import { AuthCard } from '@/components/auth-card';
import { SignUpForm } from '@/components/sign-up-form';
import { submitFaculty } from '../actions';
import { requestVerification } from '../../verify-email/actions';
export const metadata = { title: 'Apply as Faculty | CS-GAMUERS' };
export default function SignUpPage() {
  return (
    <AuthCard>
      <SignUpForm role="faculty" submit={submitFaculty} resend={requestVerification} />
    </AuthCard>
  );
}
