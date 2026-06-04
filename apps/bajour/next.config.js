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
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
      GA_ID: process.env.GA_ID || '',
      MAILCHIMP_POPUP_SCRIPT_URL: process.env.MAILCHIMP_POPUP_SCRIPT_URL || '',
    },
  },
  async redirects() {
    return [
      ...((await wepNextConfig.redirects?.()) ?? []),
      {
        source: '/home',
        destination: '/',
        permanent: false,
      },
      {
        source: '/a/:id((?!tag|id).*)/:slug',
        destination: '/a/:slug',
        permanent: false,
      },
      {
        source: '/tag/:slug',
        destination: '/a/tag/:slug',
        permanent: false,
      },
      {
        source: '/profile/dashboard',
        destination: '/login',
        permanent: false,
        has: [
          {
            type: 'query',
            key: 'jwt',
          },
        ],
      },
      {
        source: '/profile/dashboard',
        destination: '/profile',
        permanent: false,
      },
      {
        source: '/member-uebersicht',
        destination: '/mitmachen',
        permanent: false,
      },
      {
        source: '/goenner-uebersicht',
        destination: '/mitmachen',
        permanent: false,
      },
      {
        source: '/spende',
        destination: '/mitmachen',
        permanent: false,
      },
      {
        source: '/unterstuetzen',
        destination: '/mitmachen',
        permanent: false,
      },
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
