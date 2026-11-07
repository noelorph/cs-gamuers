'use server';
import { performSignIn, type SignInFeedback } from '@/features/accounts/sign-in-action';
export async function submitSignIn(_previous: SignInFeedback, form: FormData) {
  return performSignIn(form, 'standard');
}
