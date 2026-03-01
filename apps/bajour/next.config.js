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

module.exports = withSentry(composePlugins(...plugins)(nextConfig));
