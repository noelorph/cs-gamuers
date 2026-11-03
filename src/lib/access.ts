import 'server-only';
import type { Actor, Role } from '@/features/accounts/types';
import { createRequestClient } from '@/lib/supabase/server';

export async function requireActor(requiredRole?: Role): Promise<Actor> {
  const client = await createRequestClient();
  const { data, error } = await client.rpc('current_actor');
  const actor = data?.[0];
  if (error || !actor || !actor.active) throw new Error('Authentication required');
  if (requiredRole && (actor.role !== requiredRole || actor.application_status !== 'approved'))
    throw new Error('Access denied');
  return actor;
}
