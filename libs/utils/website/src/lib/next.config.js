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
    SSR_FETCH_TIMEOUT_MS: process.env.SSR_FETCH_TIMEOUT_MS,
    API_URL_INTERNAL: process.env.API_URL_INTERNAL || '',
    API_URL: process.env.API_URL || '',
    WEBSITE_URL: process.env.WEBSITE_URL || '',
  },
  webpack(config, { webpack }) {
    /**
     * SVGR support, previously provided by the removed `nx.svgr` option
     * @see https://nx.dev/technologies/react/next/recipes/next-config-setup
     */
    config.module.rules.push({
      test: /\.svg$/,
      issuer: { not: /\.(css|scss|sass)$/ },
      resourceQuery: {
        not: [/url/],
      },
      use: [
        {
          loader: require.resolve('@svgr/webpack'),
          options: {
            svgo: false,
            titleProp: true,
            ref: true,
          },
        },
        {
          loader: require.resolve('url-loader'),
          options: {
            limit: 10000,
            name: '[name].[hash:7].[ext]',
          },
        },
      ],
    });

    /**
     * Tells Apollo turn run in production mode
     * @see https://www.apollographql.com/docs/react/development-testing/reducing-bundle-size
     */
    config.plugins.push(
      new webpack.DefinePlugin({
        'globalThis.__DEV__': false,
      })
    );

    if (process.env.ANALYZE_BUNDLE_CONCAT === 'false') {
      config.optimization.concatenateModules = false;
    }

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
  transpilePackages: ['react-tweet', '@faker-js/faker'],
};

module.exports = nextConfig;
