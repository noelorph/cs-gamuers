'use server';
import { headers } from 'next/headers';
import { assertMutationOrigin } from '@/lib/request-security';
import {
  correctStudentNumber,
  getApplication,
  reviewApplication,
} from '@/features/accounts/applications';
import type { ApplicationDecision } from '@/features/accounts/application-types';
export async function submitReview(input: ApplicationDecision) {
  assertMutationOrigin(
    new Request('https://local.invalid', { method: 'POST', headers: await headers() })
  );
  return reviewApplication(input);
}
export async function readReview(id: string) {
  return getApplication(id);
}
export async function releaseStudentNumber(input: {
  id: string;
  version: number;
  studentNumber: string;
  replacementNumber: string;
  reason: string;
  verified: boolean;
}) {
  assertMutationOrigin(
    new Request('https://local.invalid', { method: 'POST', headers: await headers() })
  );
  return correctStudentNumber(input);
}
