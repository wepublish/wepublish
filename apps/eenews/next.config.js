//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const { withSentryConfig } = require('@sentry/nextjs');
const wepNextConfig = require('../../libs/utils/website/src/lib/next.config');
const { legacyRedirects } = require('./src/redirects/legacy-redirects.cjs');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled:
    process.env.NODE_ENV === 'production' && !!process.env.ANALYZE_BUNDLE,
  openAnalyzer: false,
});

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ...wepNextConfig,
  serverRuntimeConfig: {
    env: {
      API_URL_INTERNAL: process.env.API_URL_INTERNAL || '',
    },
  },
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
    },
  },
  async redirects() {
    return [
      ...((await wepNextConfig.redirects?.()) ?? []),
      ...legacyRedirects(),
      { source: '/event', destination: '/', permanent: false },
      { source: '/events', destination: '/', permanent: false },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer,
];

module.exports = withSentryConfig(composePlugins(...plugins)(nextConfig), {
  silent: true,
});
