//@ts-check

const { composePlugins, withNx } = require('@nx/next');
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
  webpack(config, options) {
    // Call parent webpack config if it exists
    if (wepNextConfig.webpack) {
      config = wepNextConfig.webpack(config, options);
    }

    // Add .woff and .woff2 font loader
    config.module.rules.push({
      test: /\.(woff|woff2)$/,
      type: 'asset/resource',
    });

    return config;
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

module.exports = composePlugins(...plugins)(nextConfig);
