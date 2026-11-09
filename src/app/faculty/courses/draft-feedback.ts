import type { DraftResult } from '@/features/content/types';
export function draftError(result: Extract<DraftResult<unknown>, { ok: false }>) {
  return {
    validation: 'Check the fields below. Your changes are still here.',
    conflict:
      'This draft changed in another tab. Your changes are still here. Reload saved draft only when ready to discard them.',
    unavailable:
      'The result could not be confirmed. Your changes are still here. Check your connection before trying again.',
    unauthenticated:
      'Your session expired. Keep this page open and sign in again in another tab before retrying.',
    forbidden: 'You no longer have access to change this draft. Your changes are still here.',
  }[result.code];
}
