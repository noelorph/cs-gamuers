import 'server-only';
import { requireActor } from '@/lib/access';
import { createRequestClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import type { CourseDraft, DraftDetails, DraftResult } from './types';
import { validateDraftDetails } from './validation';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const unavailable = { ok: false, code: 'unavailable' } as const;
function failure(error: unknown): DraftResult<never> {
  if (error instanceof Error && error.message === 'Authentication required')
    return { ok: false, code: 'unauthenticated' };
  if (error instanceof Error && error.message === 'Access denied')
    return { ok: false, code: 'forbidden' };
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  if (code === 'PT401') return { ok: false, code: 'unauthenticated' };
  if (code === 'PT403' || code === '42501') return { ok: false, code: 'forbidden' };
  return unavailable;
}
function project(row: Database['public']['Views']['course_drafts']['Row']): CourseDraft {
  return {
    id: row.id!,
    revisionId: row.revision_id!,
    ownerId: row.owner_id!,
    version: row.version!,
    details: row.details as DraftDetails,
    updatedAt: row.updated_at!,
  };
}
export async function listOwnCourseDrafts(): Promise<DraftResult<CourseDraft[]>> {
  try {
    const actor = await requireActor('faculty');
    const client = await createRequestClient();
    const { data, error } = await client
      .from('course_drafts')
      .select('*')
      .eq('owner_id', actor.id)
      .order('updated_at', { ascending: false })
      .order('id');
    if (error) return failure(error);
    return { ok: true, value: (data ?? []).map(project) };
  } catch (error) {
    return failure(error);
  }
}
export async function getOwnCourseDraft(id: string): Promise<DraftResult<CourseDraft>> {
  if (!uuid.test(id)) return unavailable;
  try {
    const actor = await requireActor('faculty');
    const client = await createRequestClient();
    const { data, error } = await client
      .from('course_drafts')
      .select('*')
      .eq('owner_id', actor.id)
      .eq('id', id)
      .maybeSingle();
    if (error) return failure(error);
    return data ? { ok: true, value: project(data) } : unavailable;
  } catch (error) {
    return failure(error);
  }
}
export async function createCourseDraft(
  id: string,
  details: DraftDetails
): Promise<DraftResult<CourseDraft>> {
  const validated = validateDraftDetails(details);
  if (!validated.ok) return { ok: false, code: 'validation', fields: validated.fields };
  if (!uuid.test(id)) return { ok: false, code: 'validation' };
  try {
    await requireActor('faculty');
    const client = await createRequestClient();
    const { data, error } = await client.rpc('create_course_draft', {
      course_id: id,
      details: validated.value,
    });
    if (error) return failure(error);
    return data as DraftResult<CourseDraft>;
  } catch (error) {
    return failure(error);
  }
}
export async function updateCourseDraft(
  id: string,
  expectedVersion: number,
  details: DraftDetails
): Promise<DraftResult<CourseDraft>> {
  const validated = validateDraftDetails(details);
  if (!validated.ok) return { ok: false, code: 'validation', fields: validated.fields };
  if (
    !uuid.test(id) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    expectedVersion > 2147483647
  )
    return { ok: false, code: 'validation' };
  try {
    await requireActor('faculty');
    const client = await createRequestClient();
    const { data, error } = await client.rpc('update_course_draft', {
      course_id: id,
      expected_version: expectedVersion,
      details: validated.value,
    });
    if (!error) return data as DraftResult<CourseDraft>;
    const failed = failure(error);
    if (!failed.ok && failed.code !== 'unavailable') return failed;
  } catch (error) {
    const failed = failure(error);
    if (!failed.ok && failed.code !== 'unavailable') return failed;
  }
  const current = await getOwnCourseDraft(id);
  // A read cannot prove which concurrent request committed; never invent success.
  return current.ok && current.value.version !== expectedVersion
    ? { ok: false, code: 'conflict' }
    : unavailable;
}
export async function deleteCourseDraft(
  id: string,
  expectedVersion: number
): Promise<DraftResult<null>> {
  if (
    !uuid.test(id) ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 1 ||
    expectedVersion > 2147483647
  )
    return { ok: false, code: 'validation' };
  try {
    await requireActor('faculty');
    const client = await createRequestClient();
    const { data, error } = await client.rpc('delete_course_draft', {
      course_id: id,
      expected_version: expectedVersion,
    });
    if (!error) return data as DraftResult<null>;
    const failed = failure(error);
    if (!failed.ok && failed.code !== 'unavailable') return failed;
  } catch (error) {
    const failed = failure(error);
    if (!failed.ok && failed.code !== 'unavailable') return failed;
  }
  const current = await getOwnCourseDraft(id);
  // A read cannot prove which concurrent request committed; never invent success.
  return current.ok && current.value.version !== expectedVersion
    ? { ok: false, code: 'conflict' }
    : unavailable;
}
