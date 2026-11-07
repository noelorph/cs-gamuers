import type { ApplicationStatus } from './types';
export type ApplicationSummary = {
  id: string;
  full_name: string;
  role: 'student' | 'faculty';
  status: ApplicationStatus;
  applied_at: string;
};
export type Application = ApplicationSummary & {
  email: string;
  student_number: string | null;
  employee_number: string | null;
  version: number;
  email_verified: boolean;
  replacement?: { email: string; expires_at: string } | null;
  history: { id: string; event: string; reason: string; created_at: string }[];
  delivery_state?: 'pending' | 'sending' | 'sent' | 'failed' | 'discarded' | null;
  retained_numbers?: string[];
};
export type ApplicationResult<T = Application> =
  | { ok: true; value: T }
  | {
      ok: false;
      code:
        | 'forbidden'
        | 'unavailable'
        | 'conflict'
        | 'validation'
        | 'number_reserved'
        | 'email_reserved'
        | 'email_pending'
        | 'throttled';
    };
export type ApplicationDecision = {
  id: string;
  version: number;
  requestId: string;
  decision: 'approve' | 'needs_correction' | 'reject' | 'reopen';
  reason: string;
  attestations: Record<string, boolean>;
};
export const applicationLabels: Record<ApplicationStatus, string> = {
  pending: 'Pending review',
  needs_correction: 'Needs correction',
  approved: 'Application approved',
  rejected: 'Application rejected',
};
export const applicationError = {
  throttled: 'Too many requests. Wait before requesting another email link.',
  forbidden: 'Your access has ended. Sign in again.',
  unavailable: 'We could not confirm the result. Retry to check the same request.',
  conflict: 'Application updated elsewhere. Reload the current application before continuing.',
  validation:
    'Check the required fields and verification checks. Reasons must contain 1–2,000 characters.',
  email_reserved:
    'This email cannot be used for this application. Check the address or contact an Administrator.',
  number_reserved: 'An Administrator must verify this student number before it can be reassigned.',
  email_pending: 'Complete or cancel replacement email verification before continuing.',
};
