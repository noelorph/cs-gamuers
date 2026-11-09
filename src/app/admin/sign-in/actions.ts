'use server';
import { performSignIn, type SignInFeedback } from '@/features/accounts/sign-in-action';
export async function submitAdminSignIn(_previous: SignInFeedback, form: FormData) {
  return performSignIn(form, 'admin');
}
