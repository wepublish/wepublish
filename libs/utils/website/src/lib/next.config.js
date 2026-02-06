//@ts-check

const { join } = require('path');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'standalone',
  nx: {
    svgr: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    emotion: true,
  },
  env: {
    DEPLOY_ENV: process.env.DEPLOY_ENV,
  },
  webpack(config, { webpack }) {
    /**
     * Tells Apollo turn run in production mode
     * @see https://www.apollographql.com/docs/react/development-testing/reducing-bundle-size
     */
    config.plugins.push(
      new webpack.DefinePlugin({
        'globalThis.__DEV__': false,
      })
    );

    return config;
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
              value:
                'public, max-age=59, s-maxage=59, stale-while-revalidate=604800, stale-if-error=86400',
            },
          ],
        },
        {
          source: '/_next/data/:path*',
          headers: [
            {
              key: 'cache-control',
              value:
                's-maxage=59, stale-while-revalidate=59, max-age=59, stale-while-revalidate=604800, stale-if-error=86400, public',
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
  // Not needed for the monorepository but for demo purposes.
  // @wepublish/ui and @wepublish/website are ES Modules which Next does not support yet.
  // This will transpile the ES Modules to CommonJS
  transpilePackages: [
    '@wepublish/ui',
    '@wepublish/website',
    'react-tweet',
    '@faker-js/faker',
  ],
};

module.exports = nextConfig;

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'wepublish-foundation',
  project: 'bajour-frontend',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
