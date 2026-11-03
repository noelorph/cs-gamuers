import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  if (typeof challenge !== 'string' || !/^[a-f0-9]{64}$/.test(challenge))
    return (
      <p role="alert">
        This link is unavailable. Open the complete link from your email or ask the operator for a
        new email.
      </p>
    );
  return (
    <EmailForm
      challenge={challenge}
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
    <main
      id="main"
      className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-8 box-border"
    >
      <Card className="w-full">
        <CardHeader>
          <p className="m-0 text-sm text-muted-foreground">CS-GAMUERS</p>
          <h1 className="m-0 text-2xl font-semibold">Confirm your email</h1>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p>Loading confirmation…</p>}>
            <Confirmation {...props} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
