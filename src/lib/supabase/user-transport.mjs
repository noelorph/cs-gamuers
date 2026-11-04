// Shared by server requests, controlled operators and isolated native integration tests.
export function userTransport(url, key, fetcher = fetch, admit) {
  return async (input, init) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    if (target.origin !== new URL(url).origin || target.pathname.startsWith('/auth/v1/admin'))
      return Response.json({ message: 'Unavailable' }, { status: 403 });
    const auth = target.pathname.startsWith('/auth/v1/');
    if (!auth) {
      try {
        const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
        if (!token || token === key) throw Error();
        const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        // This is a fail-closed transport guard; Auth and PostgREST verify the signature.
        if (claims.role !== 'authenticated' || !claims.sub || !(claims.exp * 1000 > Date.now()))
          throw Error();
      } catch {
        return Response.json({ message: 'Authentication required' }, { status: 401 });
      }
    }
    request.headers.set('apikey', key);
    let finish;
    try {
      if (
        auth &&
        target.pathname !== '/auth/v1/logout' &&
        !['GET', 'HEAD'].includes(request.method)
      )
        finish = await admit?.(request.clone());
    } catch (error) {
      if (error?.status === 429)
        return Response.json(
          { message: 'Too many attempts', code: 'over_request_rate_limit' },
          { status: 429 }
        );
      throw error;
    }
    const response = await fetcher(request.url, {
      method: request.method,
      headers: request.headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(10000)]),
    });
    await finish?.(response.ok);
    return response;
  };
}
