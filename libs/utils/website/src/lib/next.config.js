//@ts-check

const { join } = require('path');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    emotion: true,
  },
  env: {
    APP_ENVIRONMENT: process.env.APP_ENVIRONMENT,
    APP_NAME: process.env.APP_NAME,
    APP_RELEASE_ID: process.env.APP_RELEASE_ID,
    SSR_FETCH_TIMEOUT_MS: process.env.SSR_FETCH_TIMEOUT_MS,
    API_URL_INTERNAL: process.env.API_URL_INTERNAL || '',
    API_URL: process.env.API_URL || '',
    SENTRY_DSN: process.env.SENTRY_DSN || undefined,
  },
  turbopack: {
    // SVGs are imported as URLs only; the one SVG that was used as a React
    // component is now a .tsx component, so no SVGR loader is needed. Apollo's
    // `globalThis.__DEV__` define is likewise gone: Apollo Client 4 selects its
    // dev/production build through package export conditions.
    root: join(__dirname, '../../../../../'),
  },
  async redirects() {
    return [
      {
        source: '/profile/subscription',
        destination: '/profile',
        permanent: true,
      },
    ];
  },
  headers: async () =>
    process.env.NODE_ENV === 'production' ?
      [
        {
          source: '/:path*',
          headers: [
            {
              key: 'cache-control',
              value: 'public, max-age=59, s-maxage=59, stale-if-error=86400',
            },
          ],
        },
        {
          source: '/_next/data/:path*',
          headers: [
            {
              key: 'cache-control',
              value: 's-maxage=59, max-age=59, stale-if-error=86400, public',
            },
          ],
        },
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'cache-control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
        {
          source: '/profile',
          headers: [
            {
              key: 'cache-control',
              value: 'no-store',
            },
          ],
        },
        {
          source: '/profile/:path*',
          headers: [
            {
              key: 'cache-control',
              value: 'no-store',
            },
          ],
        },
      ]
    : [],
  experimental: {
    scrollRestoration: true,
  },
  outputFileTracingRoot: join(__dirname, '../../../../../'),
  outputFileTracingExcludes: {
    '*': [
      '**/node_modules/@swc/core-linux-x64-musl',
      '**/node_modules/@swc/core-linux-x64-gnu ',
      '**/node_modules/@esbuild/linux-x64',
      '**/node_modules/webpack',
      '**/node_modules/sass',
      '**/node_modules/terser',
      '**/node_modules/uglify-js',
    ],
  },
  // Emotion and MUI must go through a single compilation pipeline, otherwise
  // Turbopack can resolve `@emotion/react` twice (CJS for MUI's styled engine,
  // ESM for the app's `@emotion/styled`) and the theme context server-renders
  // empty, e.g. `theme.breakpoints` undefined.
  transpilePackages: [
    'react-tweet',
    '@faker-js/faker',
    '@emotion/react',
    '@emotion/styled',
    '@mui/styled-engine',
  ],
};

module.exports = nextConfig;
