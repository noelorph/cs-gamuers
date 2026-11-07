import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { paths } from '@/config/paths';
async function SessionFeedback({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (await searchParams).session === 'ended' ? (
    <p role="status" className="mb-6 mt-0">
      Your session ended. Sign in again.
    </p>
  ) : null;
}
export function SignInPage({
  admin = false,
  children,
  searchParams,
}: {
  admin?: boolean;
  children: ReactNode;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="min-h-dvh bg-page">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="flex flex-wrap items-center justify-between gap-4 border-0 border-b border-solid border-border bg-card px-4 py-6 md:px-6">
        <Link href="/" className="text-lg font-semibold no-underline text-primary">
          CS-GAMUERS
        </Link>
        <Link href={admin ? paths.signIn : paths.adminSignIn} className="text-primary">
          {admin ? 'Standard sign in' : 'Administrator sign in'}
        </Link>
      </header>
      <main id="main" className="px-4 py-8 md:px-6 md:py-12">
        <Card className="mx-auto w-full max-w-[480px] box-border">
          <CardHeader className="gap-4">
            <h1 className="m-0 text-2xl font-semibold leading-tight">
              {admin ? 'Administrator sign in' : 'Sign in'}
            </h1>
            <p className="m-0 text-muted-foreground">
              {admin
                ? 'Use your invited Administrator account.'
                : 'For Students, Faculty, and Program Heads.'}
            </p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={null}>
              <SessionFeedback searchParams={searchParams} />
            </Suspense>
            {children}
            {!admin && (
              <div className="mt-6 space-y-4 text-sm">
                <p>
                  <Link href="/auth/sign-up/student">Apply as a Student</Link>
                </p>
                <p>
                  <Link href="/auth/sign-up/faculty">Apply as Faculty</Link>
                </p>
                <p>
                  Email not verified yet? <Link href="/auth/verify-email">Verify your email</Link>
                </p>
              </div>
            )}
            {admin && (
              <p className="mb-0 mt-6 text-sm text-muted-foreground">
                Administrator accounts are created by invitation.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
