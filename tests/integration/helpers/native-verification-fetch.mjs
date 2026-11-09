import { setTimeout as pause } from 'node:timers/promises';

// Native TEST verification shares an IP bucket; retry only a definite quota rejection.
export function nativeVerificationFetch(url, fetcher = fetch) {
  const origin = new URL(url).origin;
  return async (input, init) => {
    const request = new Request(input, init);
    const response = await fetcher(request.clone());
    const target = new URL(request.url);
    if (
      request.method !== 'POST' ||
      target.origin !== origin ||
      target.pathname !== '/auth/v1/verify' ||
      target.search ||
      response.status !== 429
    )
      return response;
    const error = await response
      .clone()
      .json()
      .catch(() => null);
    if (error?.code !== 'over_request_rate_limit') return response;
    const retryAfter = response.headers.get('retry-after');
    const seconds = retryAfter === null ? 11 : Number(retryAfter);
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 11) return response;
    console.warn('TEST native verification quota reached; waiting before one retry.');
    await pause(seconds * 1000, undefined, { signal: request.signal });
    request.signal.throwIfAborted();
    return fetcher(request.clone());
  };
}
