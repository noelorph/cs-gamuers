import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-page">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="flex flex-wrap items-center justify-between gap-4 border-0 border-b border-solid border-border bg-card px-4 py-6 md:px-6">
        <Link href="/" className="text-lg font-semibold no-underline text-primary">
          CS-GAMUERS
        </Link>
        <Link href="/auth/sign-in" className="text-primary">
          Sign in
        </Link>
      </header>
      <main id="main" className="px-4 py-8 md:px-6 md:py-12">
        <Card className="mx-auto box-border w-full max-w-[480px]">
          <CardContent className="flex flex-col gap-6 [&>p]:m-0 [overflow-wrap:anywhere]">
            {children}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
