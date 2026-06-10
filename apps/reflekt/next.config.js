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
    },
  },
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
      PA_ID: process.env.PA_ID || '',
      GTM_ID: process.env.GTM_ID || '',
    },
  },
  async redirects() {
    return [
      ...((await wepNextConfig.redirects?.()) ?? []),
      {
        source: '/a/wikipolitik',
        destination: 'https://wiki.reflekt.ch/',
        permanent: true,
      },
      { source: '/antepay', destination: '/a/antepay', permanent: true },
      {
        source: '/antepay-prozess',
        destination: '/a/antepay-prozess',
        permanent: true,
      },
      {
        source: '/ausbeutung-mit-aussicht',
        destination: '/a/ausbeutung-mit-aussicht',
        permanent: true,
      },
      {
        source: '/aussageverweigerung',
        destination: '/a/aussageverweigerung',
        permanent: true,
      },
      { source: '/berater', destination: '/a/berater', permanent: true },
      { source: '/boyun', destination: '/a/boyun', permanent: true },
      {
        source: '/cities-for-sale',
        destination: '/a/cities-for-sale',
        permanent: true,
      },
      { source: '/coaching', destination: '/a/coaching', permanent: true },
      {
        source: '/credit-crisis',
        destination: '/a/credit-crisis',
        permanent: true,
      },
      {
        source: '/das-schattenregister',
        destination: '/a/das-schattenregister',
        permanent: true,
      },
      {
        source: '/datenfestung',
        destination: '/a/datenfestung',
        permanent: true,
      },
      {
        source: '/der-gluecksspielkoenig-vom-bodensee',
        destination: '/a/der-gluecksspielkoenig-vom-bodensee',
        permanent: true,
      },
      { source: '/eritrea', destination: '/a/eritrea', permanent: true },
      {
        source: '/eritrea-yonas',
        destination: '/a/eritrea-yonas',
        permanent: true,
      },
      {
        source: '/europas-neue-grossgrundbesitzer',
        destination: '/a/europas-neue-grossgrundbesitzer',
        permanent: true,
      },
      { source: '/gift', destination: '/a/gift', permanent: true },
      {
        source: '/globalunion',
        destination: '/a/globalunion',
        permanent: true,
      },
      { source: '/haft', destination: '/a/haft', permanent: true },
      { source: '/hatespeech', destination: '/a/hatespeech', permanent: true },
      {
        source: '/im-stich-gelassen',
        destination: '/a/im-stich-gelassen',
        permanent: true,
      },
      {
        source: '/interview-odermatt',
        destination: '/a/interview-odermatt',
        permanent: true,
      },
      { source: '/jacobs', destination: '/a/jacobs', permanent: true },
      { source: '/malta', destination: '/a/malta', permanent: true },
      { source: '/palumbo', destination: '/a/palumbo', permanent: true },
      {
        source: '/recherchen',
        destination: '/a/tag/recherchen',
        permanent: true,
      },
      {
        source: '/reflekt-im-gespraech',
        destination: '/a/reflekt-im-gespraech',
        permanent: true,
      },
      { source: '/sammelwut', destination: '/a/sammelwut', permanent: true },
      {
        source: '/sewn-on-the-edge',
        destination: '/a/sewn-on-the-edge',
        permanent: true,
      },
      {
        source: '/sewn-on-the-edge-bangla',
        destination: '/a/sewn-on-the-edge-bangla',
        permanent: true,
      },
      {
        source: '/so-in-transparent-sind-die-immobilien-unternehmen',
        destination: '/a/so-in-transparent-sind-die-immobilien-unternehmen',
        permanent: true,
      },
      { source: '/swisslife', destination: '/a/swisslife', permanent: true },
      { source: '/syngenta', destination: '/a/syngenta', permanent: true },
      { source: '/taliban', destination: '/a/taliban', permanent: true },
      { source: '/tonnage', destination: '/a/tonnage', permanent: true },
      { source: '/uni', destination: '/a/uni', permanent: true },
      {
        source: '/welchen-firmen-gehoert-zuerich',
        destination: '/a/welchen-firmen-gehoert-zuerich',
        permanent: true,
      },
      {
        source: '/wem-gehoert-basel',
        destination: '/a/wem-gehoert-basel',
        permanent: true,
      },
      {
        source: '/wikipolitik',
        destination: '/a/wikipolitik',
        permanent: true,
      },
      {
        source: '/willkommen-guelsha',
        destination: '/a/willkommen-guelsha',
        permanent: true,
      },
      { source: '/windkraft', destination: '/a/windkraft', permanent: true },
      {
        source: '/wohnen-am-limit',
        destination: '/a/wohnen-am-limit',
        permanent: true,
      },
      {
        source: '/zuercher-journalistenpreis-fuer-mocambique-recherche',
        destination: '/a/zuercher-journalistenpreis-fuer-mocambique-recherche',
        permanent: true,
      },
      {
        source: '/zuercher-unternehmer-war-pokerchef-der-gluecksspielmafia',
        destination:
          '/a/zuercher-unternehmer-war-pokerchef-der-gluecksspielmafia',
        permanent: true,
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
