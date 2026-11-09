import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.APP_ORIGIN ? [new URL(process.env.APP_ORIGIN).hostname] : [],
  // Email challenges and holder passwords must not enter development request/action logs.
  logging: {
    incomingRequests: { ignore: [/\/auth\//, /\/admin\/sign-in/] },
    serverFunctions: false,
  },
  async headers() {
    return [
      {
        source: '/:path(auth|student|faculty|program-head|admin)/:rest*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Referrer-Policy', value: 'same-origin' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/auth/email/:rest*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },
  experimental: {
    agentFeedback: true,
    serverActions: { bodySizeLimit: '1mb' },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
