//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const { withSentryConfig } = require('@sentry/nextjs');
const wepNextConfig = require('../../libs/utils/website/src/lib/next.config');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.NODE_ENV === 'production',
  openAnalyzer: false,
});

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ...wepNextConfig,
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
    },
  },
  i18n: {
    defaultLocale: 'default',
    locales: ['default', 'de', 'fr'],
    localeDetection: false,
  },
  async redirects() {
    return [
      ...((await wepNextConfig.redirects?.()) ?? []),
      { source: '/home', destination: '/', permanent: true },
      { source: '/das-projekt', destination: '/', permanent: true },
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
