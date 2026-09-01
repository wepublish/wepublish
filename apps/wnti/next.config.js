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
  env: {
    ...wepNextConfig.env,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer,
];

module.exports = withSentryConfig(composePlugins(...plugins)(nextConfig), {
  // `silent: true` suppresses info, warn AND error, so a failed sourcemap
  // upload leaves no trace in the build log. Keep the plugin loud.
  silent: false,
  // Upload all client chunks, not just static/chunks/pages + static/chunks/app.
  // Shared chunks hold most of our app code; framework/polyfills/webpack chunks
  // stay excluded by the plugin's own ignore list.
  widenClientFileUpload: true,
});
