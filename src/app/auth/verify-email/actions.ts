'use server';
import { resendVerification } from '@/features/accounts/registration';
export async function requestVerification(email: string) {
  return resendVerification(email);
}
