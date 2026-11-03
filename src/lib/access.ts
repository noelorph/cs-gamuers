import 'server-only';
import type { Actor, Role } from '@/features/accounts/types';
import { createRequestClient } from '@/lib/supabase/server';

export async function requireActor(requiredRole?: Role): Promise<Actor> {
  const client = await createRequestClient();
  const { data, error } = await client.rpc('current_actor');
  const actor = data?.[0];
  if (error || !actor || !actor.active) throw new Error('Authentication required');
  if (actor.application_status !== 'approved' || (requiredRole && actor.role !== requiredRole))
    throw new Error('Access denied');
  return { id: actor.id, role: actor.role };
}
