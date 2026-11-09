import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="box-border grid min-h-dvh place-items-center bg-accent px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="m-0 text-4xl font-semibold text-accent-foreground">CS-GAMUERS</h1>
        <p className="m-0 text-muted-foreground">A supplemental learning application.</p>
        <Button asChild>
          <a href="/auth/sign-in">Sign in</a>
        </Button>
        <a href="/auth/sign-up/student">Apply as a Student</a>
        <a href="/auth/sign-up/faculty">Apply as Faculty</a>
        <a href="/admin/sign-in">Administrator sign in</a>
      </div>
    </main>
  );
}
