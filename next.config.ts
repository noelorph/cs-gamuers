import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Email challenges and holder passwords must not enter development request/action logs.
  logging: { incomingRequests: { ignore: [/\/auth\/email/] }, serverFunctions: false },
  async headers() {
    return [
      {
        source: '/auth/email/:path*',
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
