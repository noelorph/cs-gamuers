export class AuthenticationThrottled extends Error {
  status = 429;
}
export async function authenticationAdmission(admin, projectRef, sourceIp, verifiedRef, request) {
  // Operator readiness is not evidence; leave unset until the native gate probe passes.
  if (verifiedRef !== projectRef) throw new Error('Authentication unavailable');
  const target = new URL(request.url);
  const body =
    target.pathname === '/auth/v1/token' && target.searchParams.get('grant_type') === 'password'
      ? await request.json()
      : null;
  const identifier = body
    ? String(body.email ?? '')
        .trim()
        .toLowerCase()
    : null;
  const { data, error } = await admin.rpc('admit_authentication', {
    source_ip: sourceIp,
    identifier,
  });
  if (error) throw new Error('Authentication unavailable');
  if (!data) throw new AuthenticationThrottled();
  return async (succeeded) => {
    if (!succeeded || !identifier) return;
    const result = await admin.rpc('finish_authentication', { attempt_id: data, succeeded });
    if (result.error) throw new Error('Authentication unavailable');
  };
}
