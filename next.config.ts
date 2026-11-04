import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Email challenges and holder passwords must not enter development request/action logs.
  logging: { incomingRequests: { ignore: [/\/auth\//] }, serverFunctions: false },
  async headers() {
    return [
      {
        source: '/:path(auth|student|faculty|program-head|admin)/:rest*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
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
