//@ts-check

const { composePlugins, withNx } = require('@nx/next');
const { withSentryConfig } = require('@sentry/nextjs');
const wepNextConfig = require('../../libs/utils/website/src/lib/next.config');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled:
    process.env.NODE_ENV === 'production' && !!process.env.ANALYZE_BUNDLE,
  openAnalyzer: false,
});

const reflektArticleRedirectSlugs = [
  'angst-am-lehrstuhl',
  'antepay',
  'antepay-prozess',
  'antepay_kamp',
  'ausbeutung-mit-aussicht',
  'aussageverweigerung',
  'berater',
  'berater_kamp',
  'boyun',
  'cities-for-sale',
  'coaching',
  'credit-crisis',
  'das-schattenregister',
  'datenbank-der-datenbanken',
  'datenfestung',
  'der-gluecksspielkoenig-vom-bodensee',
  'eritrea',
  'eritrea-yonas',
  'eritrea_yonas',
  'europas-neue-grossgrundbesitzer',
  'gift',
  'globalunion',
  'haft',
  'hatespeech',
  'hatespeech_kamp',
  'im-stich-gelassen',
  'interview-odermatt',
  'interview_odermatt',
  'jacobs',
  'malta',
  'palumbo',
  'pokerchef',
  'sammelwut',
  'sewn-on-the-edge',
  'sewn-on-the-edge-bangla',
  'so-in-transparent-sind-die-immobilien-unternehmen',
  'swisslife',
  'syngenta',
  'taliban',
  'tonnage',
  'uni',
  'uni-eng',
  'unifr',
  'welchen-firmen-gehoert-zuerich',
  'wem-gehoert-basel',
  'windkraft',
  'wohnen-am-limit',
  'wohnenamlimit',
  'zuerichaufdecken',
];

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
      {
        source: '/recherchen/wikipolitik',
        destination: 'https://wiki.reflekt.ch/',
        permanent: true,
      },
      {
        source: '/wikipolitik',
        destination: 'https://wiki.reflekt.ch/',
        permanent: true,
      },
      ...reflektArticleRedirectSlugs.flatMap(slug => [
        {
          source: `/recherchen/${slug}`,
          destination: `/a/${slug}`,
          permanent: true,
        },
        { source: `/${slug}`, destination: `/a/${slug}`, permanent: true },
      ]),
      {
        source: '/recherchen',
        destination: '/a/tag/recherchen',
        permanent: true,
      },
      { source: '/news', destination: '/a/tag/news', permanent: true },
      {
        source: '/jetzt-lesen',
        destination: '/a/tag/recherchen',
        permanent: true,
      },
      { source: '/mein-konto', destination: '/login', permanent: true },
      { source: '/kasse', destination: '/login', permanent: true },
      { source: '/kasse/:path*', destination: '/login', permanent: true },
      { source: '/spenden-3', destination: '/mitmachen', permanent: true },
      { source: '/spenden', destination: '/mitmachen', permanent: true },
      { source: '/spende', destination: '/mitmachen', permanent: true },
      {
        source: '/jetzt-mitmachen',
        destination: '/mitmachen',
        permanent: true,
      },
      {
        source: '/reflekt-im-gespraech',
        destination: '/a/reflekt-im-gespraech',
        permanent: true,
      },
      {
        source: '/willkommen-guelsha',
        destination: '/a/willkommen-guelsha',
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
