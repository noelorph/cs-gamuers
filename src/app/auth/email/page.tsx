import { Suspense } from 'react';
import { AuthCard } from '@/components/auth-card';
import { EmailForm } from './email-form';
import { prepareConfirmation, confirmEmail, acceptInvitation } from './actions';
export const metadata = {
  title: 'Confirm email | CS-GAMUERS',
  robots: { index: false, follow: false },
};
async function Confirmation({
  searchParams,
}: {
  searchParams: Promise<{ challenge?: string | string[] }>;
}) {
  const { challenge } = await searchParams;
  return (
    <EmailForm
      challenge={typeof challenge === 'string' && /^[a-f0-9]{64}$/.test(challenge) ? challenge : ''}
      prepare={prepareConfirmation}
      confirm={confirmEmail}
      complete={acceptInvitation}
    />
  );
}
export default function EmailPage(props: {
  searchParams: Promise<{ challenge?: string | string[] }>;
}) {
  return (
    <AuthCard>
      <Suspense fallback={<p>Loading confirmation…</p>}>
        <Confirmation {...props} />
      </Suspense>
    </AuthCard>
  );
}
