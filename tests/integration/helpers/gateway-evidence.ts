// Observed on isolated TEST settings/retired-key probes; unknown codes fail closed for review.
export function isGatewayKeyRejection(response: Response): boolean {
  return (
    response.status === 401 &&
    [
      'UNAUTHORIZED_MISSING_API_KEY',
      'UNAUTHORIZED_INVALID_API_KEY',
      'UNAUTHORIZED_UNREGISTERED_API_KEY',
      'UNAUTHORIZED_DISABLED_LEGACY_KEY',
    ].includes(response.headers.get('sb-error-code') ?? '')
  );
}
