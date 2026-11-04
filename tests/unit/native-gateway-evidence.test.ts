// @vitest-environment node
import { expect, test } from 'vitest';
import { isGatewayKeyRejection } from '../integration/helpers/gateway-evidence';
test('a native Auth 401 is not evidence of a private API-key gateway', () => {
  const cases: Record<string, string>[] = [
    {},
    { 'x-sb-error-code': 'bad_jwt' },
    { 'sb-error-code': 'bad_jwt' },
  ];
  for (const headers of cases)
    expect(isGatewayKeyRejection(new Response(null, { status: 401, headers }))).toBe(false);
});
test('only gateway key-error provenance with 401 establishes key rejection', () => {
  for (const code of ['UNAUTHORIZED_MISSING_API_KEY', 'UNAUTHORIZED_INVALID_API_KEY']) {
    expect(
      isGatewayKeyRejection(new Response(null, { status: 401, headers: { 'sb-error-code': code } }))
    ).toBe(true);
    expect(
      isGatewayKeyRejection(new Response(null, { status: 200, headers: { 'sb-error-code': code } }))
    ).toBe(false);
  }
});
