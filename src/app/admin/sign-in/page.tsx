import { SignInPage } from '@/components/sign-in-page';
import { SignInForm } from '@/components/sign-in-form';
import { submitAdminSignIn } from './actions';
export const metadata = { title: 'Administrator sign in | CS-GAMUERS' };
export default function Page({ searchParams }: PageProps<'/admin/sign-in'>) {
  return (
    <SignInPage admin searchParams={searchParams}>
      <SignInForm submit={submitAdminSignIn} />
    </SignInPage>
  );
}
