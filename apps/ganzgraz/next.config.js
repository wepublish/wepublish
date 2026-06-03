//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const { withSentryConfig } = require('@sentry/nextjs');
const wepNextConfig = require('../../libs/utils/website/src/lib/next.config');
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
      MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY || '',
      MAILCHIMP_SERVER_PREFIX: process.env.MAILCHIMP_SERVER_PREFIX || '',
    },
  },
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
    },
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
