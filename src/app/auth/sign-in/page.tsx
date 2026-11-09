import { SignInPage } from '@/components/sign-in-page';
import { SignInForm } from '@/components/sign-in-form';
import { submitSignIn } from './actions';
export const metadata = { title: 'Sign in | CS-GAMUERS' };
export default function Page({ searchParams }: PageProps<'/auth/sign-in'>) {
  return (
    <SignInPage searchParams={searchParams}>
      <SignInForm submit={submitSignIn} />
    </SignInPage>
  );
}
