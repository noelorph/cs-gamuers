'use server';
import { headers } from 'next/headers';
import { assertMutationOrigin } from '@/lib/request-security';
import {
  createCourseDraft,
  updateCourseDraft,
  deleteCourseDraft,
  getOwnCourseDraft,
} from '@/features/content/courses';
import type { DraftDetails, DraftResult, CourseDraft } from '@/features/content/types';
async function admitted() {
  try {
    assertMutationOrigin(
      new Request('https://local.invalid', { method: 'POST', headers: await headers() })
    );
    return true;
  } catch {
    return false;
  }
}
export async function saveDraft(
  id: string,
  version: number | null,
  details: DraftDetails
): Promise<DraftResult<CourseDraft>> {
  if (!(await admitted())) return { ok: false, code: 'forbidden' };
  return version === null
    ? createCourseDraft(id, details)
    : updateCourseDraft(id, version, details);
}
export async function removeDraft(id: string, version: number) {
  if (!(await admitted())) return { ok: false, code: 'forbidden' } as const;
  return deleteCourseDraft(id, version);
}
export async function readDraft(id: string) {
  return getOwnCourseDraft(id);
}
