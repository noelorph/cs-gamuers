// Observed on isolated TEST settings probes; unknown gateway codes fail closed for manual review.
export function isGatewayKeyRejection(response: Response): boolean {
  return (
    response.status === 401 &&
    ['UNAUTHORIZED_MISSING_API_KEY', 'UNAUTHORIZED_INVALID_API_KEY'].includes(
      response.headers.get('sb-error-code') ?? ''
    )
  );
}
