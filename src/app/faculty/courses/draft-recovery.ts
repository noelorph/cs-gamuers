'use client';
import type { DraftDetails } from '@/features/content/types';
export type DraftRecovery = {
  id: string;
  version: number | null;
  details: DraftDetails;
  hours: string;
  error: string;
  fields: Record<string, string>;
};
// Browser-heap edits only; never an authorization or saved-data cache.
export const draftRecovery = new Map<string, DraftRecovery>();
export function clearDraftRecovery(ownerId: string, id: string) {
  for (const [key, snapshot] of draftRecovery) {
    if (key.startsWith(`${ownerId}/`) && snapshot.id === id) draftRecovery.delete(key);
  }
}
