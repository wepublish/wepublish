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
  productionBrowserSourceMaps: true,
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
