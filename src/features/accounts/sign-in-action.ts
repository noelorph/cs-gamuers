import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertMutationOrigin } from '@/lib/request-security';
import { signIn, type SignInPortal } from './session';
export type SignInFeedback = { message: string; destination?: '/auth/sign-in' | '/admin/sign-in' };
export async function performSignIn(form: FormData, portal: SignInPortal): Promise<SignInFeedback> {
  try {
    assertMutationOrigin(
      new Request('https://local.invalid', { method: 'POST', headers: await headers() })
    );
  } catch {
    return { message: 'Open the original HTTPS sign-in page on the demonstration network.' };
  }
  const result = await signIn(
    { email: String(form.get('email') ?? ''), password: String(form.get('password') ?? '') },
    portal
  );
  if (result.ok) redirect(result.destination);
  if (result.code === 'wrong_portal')
    return {
      message:
        result.destination === '/admin/sign-in'
          ? 'Use Administrator sign in for this account.'
          : 'Use the Student, Faculty, and Program Head sign-in page for this account.',
      destination: result.destination,
    };
  return {
    message: {
      invalid_credentials: 'Email or password is incorrect. Try again.',
      throttled: 'Too many sign-in attempts. Try again later.',
      unavailable: 'Sign-in is unavailable right now. Try again.',
      deactivated:
        'This account is deactivated. Contact an Administrator about reactivation. Your saved records are retained.',
    }[result.code],
  };
}
