'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { assertMutationOrigin } from '@/lib/request-security';
import { signIn } from '@/features/accounts/session';
export async function submitSignIn(_previous: string, form: FormData) {
  try {
    assertMutationOrigin(
      new Request('https://local.invalid', { method: 'POST', headers: await headers() })
    );
  } catch {
    return 'Open the original HTTPS sign-in page on the demonstration network.';
  }
  const result = await signIn({
    email: String(form.get('email') ?? ''),
    password: String(form.get('password') ?? ''),
  });
  if (result.ok) redirect(result.destination);
  return {
    invalid_credentials: 'Email or password is incorrect.',
    throttled: 'Too many attempts. Try again in 15 minutes.',
    unavailable: 'Sign-in is unavailable. Please try again shortly.',
  }[result.code];
}
