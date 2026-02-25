//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const wepNextConfig = require('../../libs/utils/website/src/lib/next.config');
const withSentry = require('../../libs/utils/website/src/lib/withSentry');
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
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
      GA_ID: process.env.GA_ID || '',
      SPARKLOOP_ID: process.env.SPARKLOOP_ID || '',
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
      GTM_ID: process.env.GTM_ID || '',
    },
  },
  serverRuntimeConfig: {
    env: {
      MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY || '',
      MAILCHIMP_SERVER_PREFIX: process.env.MAILCHIMP_SERVER_PREFIX || '',
    },
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer,
];

module.exports = withSentry(composePlugins(...plugins)(nextConfig));
