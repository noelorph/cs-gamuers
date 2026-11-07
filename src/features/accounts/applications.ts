import 'server-only';
import { createRequestClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import type {
  Application,
  ApplicationDecision,
  ApplicationResult,
  ApplicationSummary,
} from './application-types';
import type { ApplicationStatus } from './types';
type Functions = Database['public']['Functions'];
async function call<T, N extends keyof Functions>(
  name: N,
  args: Functions[N]['Args']
): Promise<ApplicationResult<T>> {
  try {
    const { data, error } = await (await createRequestClient()).rpc(name, args);
    if (!error) return { ok: true, value: data as T };
    if (['23505', '23514'].includes(error.code) && name === 'request_application_email')
      return { ok: false, code: 'email_reserved' };
    const code = (
      {
        '42501': 'forbidden',
        PT409: 'conflict',
        PT429: 'throttled',
        '23514': 'validation',
        '23505': 'number_reserved',
        '55000': 'email_pending',
      } as const
    )[error.code as '42501'];
    return { ok: false, code: code ?? 'unavailable' };
  } catch (error) {
    return {
      ok: false,
      code:
        error instanceof Error && error.message === 'Authentication required'
          ? 'forbidden'
          : 'unavailable',
    };
  }
}
export const getApplication = (id?: string) =>
  call<Application, 'application_details'>('application_details', { target_id: id });
export const listApplications = (status: ApplicationStatus, role?: 'student' | 'faculty') =>
  call<ApplicationSummary[], 'list_applications'>('list_applications', {
    status,
    applicant_role: role,
  });
export function reviewApplication(input: ApplicationDecision) {
  return call<Application, 'review_application'>('review_application', {
    target_id: input.id,
    expected_version: input.version,
    request_id: input.requestId,
    decision: input.decision,
    reason: input.decision === 'approve' ? '' : input.reason,
    attestations: input.attestations,
  });
}
export function saveApplication(
  version: number,
  input: { fullName: string; studentNumber: string | null; employeeNumber: string | null }
) {
  return call<Application, 'save_application'>('save_application', {
    expected_version: version,
    full_name: input.fullName,
    student_number: input.studentNumber!,
    employee_number: input.employeeNumber!,
  });
}
export const resubmitApplication = (version: number) =>
  call<Application, 'resubmit_application'>('resubmit_application', { expected_version: version });
export const requestApplicationEmail = (version: number, email: string) =>
  call<Application, 'request_application_email'>('request_application_email', {
    expected_version: version,
    email,
  });
export const cancelApplicationEmail = (version: number) =>
  call<Application, 'cancel_application_email'>('cancel_application_email', {
    expected_version: version,
  });
export const correctStudentNumber = (input: {
  id: string;
  version: number;
  studentNumber: string;
  replacementNumber: string;
  reason: string;
  verified: boolean;
}) =>
  call<Application, 'correct_student_number'>('correct_student_number', {
    target_id: input.id,
    expected_version: input.version,
    student_number: input.studentNumber,
    replacement_number: input.replacementNumber,
    reason: input.reason,
    error_verified: input.verified,
  });
