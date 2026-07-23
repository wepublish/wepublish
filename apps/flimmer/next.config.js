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
  publicRuntimeConfig: {
    env: {
      STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || '',
    },
  },
  async redirects() {
    return [
      ...((await wepNextConfig.redirects?.()) ?? []),
      {
        source: '/a/:id((?!tag|preview).*)/:slug',
        destination: '/a/:slug',
        permanent: false,
      },
      {
        source: '/zh/rubrik/:slug',
        destination: '/a/tag/:slug',
        permanent: false,
      },
      {
        source: '/redaktion',
        destination: '/author',
        permanent: false,
      },
      {
        source: '/agenda',
        destination: '/event',
        permanent: false,
      },
      {
        source: '/account/profile',
        destination: '/profile',
        permanent: false,
      },
      {
        source: '/account/subscriptions',
        destination: '/profile',
        permanent: false,
      },
      {
        source: '/fluchtmigration-cricket',
        destination:
          '/a/schnuppertraining-cricket-der-populaerste-sport-afghanistans',
        permanent: false,
      },
      {
        source: '/fluchtmigration-podium-arbeitsmarkt',
        destination: '/a/podium-wie-zugaenglich-ist-unser-arbeitsmarkt',
        permanent: false,
      },
      {
        source: '/fluchtmigration-mitmachmarkt',
        destination: '/a/mitmachmarkt-wo-kann-ich-mich-engagieren',
        permanent: false,
      },
      {
        source: '/tipp',
        destination: '/a/crowdfunding-tsueritipp',
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
