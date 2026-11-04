import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SignInForm } from './sign-in-form';
export const metadata = { title: 'Sign in | CS-GAMUERS' };
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-accent">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <main
        id="main"
        className="mx-auto flex min-h-screen w-full max-w-[480px] items-center px-4 py-8 md:px-6 box-border"
      >
        <Card className="w-full shadow-overlay">
          <CardHeader>
            <p className="m-0 text-sm font-semibold text-primary">CS-GAMUERS</p>
            <h1 className="m-0 text-2xl font-semibold">Sign in</h1>
            <p className="m-0 text-muted-foreground">Use your CS-GAMUERS email and password.</p>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
