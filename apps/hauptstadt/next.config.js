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
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
      GA_ID: process.env.GA_ID || '',
      GTM_ID: process.env.GTM_ID || '',
      HTTP_ONLY_COOKIE: true,
    },
  },
  async redirects() {
    return [
      ...((await wepNextConfig.redirects?.()) ?? []),
      {
        source: '/profile/dashboard',
        destination: '/login',
        permanent: true,
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
        permanent: true,
      },
      {
        source: '/a/:id((?!tag|id).*)/:slug',
        destination: '/a/:slug',
        permanent: true,
      },
      // backwards compatibility for pages because of https://wepublish.atlassian.net/browse/HAS-23
      {
        source: '/p/:pageSlug',
        destination: '/:pageSlug',
        permanent: true,
      },
      {
        source: '/l/etikette',
        destination: '/unsere-etikette',
        permanent: true,
      },
      // backwards compatibility for pages and articles because of https://hauptstadt.atlassian.net/browse/HA-82
      // articles
      {
        source: '/article/:articleSlug',
        destination: '/a/:articleSlug',
        permanent: true,
      },
      {
        source: '/page/:pageSlug',
        destination: '/:pageSlug',
        permanent: true,
      },
      // nice links for print magazine 2024
      {
        source: '/l/auftakt',
        destination: '/a/geld-und-geist-one',
        permanent: true,
      },
      {
        source: '/l/burgerbesitz',
        destination: '/a/geld-und-geist-two',
        permanent: true,
      },
      {
        source: '/l/muehlheim',
        destination: '/a/interview-barbara-muehlheim-burgergemeinde-bern',
        permanent: true,
      },
      {
        source: '/l/burgerfinanzen',
        destination: '/a/gute-rendite-wenig-klimaschutz',
        permanent: true,
      },
      {
        source: '/l/burgerpolitik',
        destination: '/a/burgergemeinde-in-der-politik',
        permanent: true,
      },
      {
        source: '/l/kulturburger',
        destination: '/a/kulturburger ',
        permanent: true,
      },
      {
        source: '/l/burgerwald',
        destination:
          '/a/wald-burgergemeinde-bern-holz-klima-wandel-biodiversitaet-wirtschaft ',
        permanent: true,
      },
      {
        source: '/l/zuenfte',
        destination: '/a/zuenfte',
        permanent: true,
      },
      {
        source: '/l/einburgern',
        destination: '/a/einburgern-burgergemeinde',
        permanent: true,
      },
      {
        source: '/l/burgerzukunft',
        destination: '/a/vorschlaege-zukunft-burgergemeinde-bern',
        permanent: true,
      },

      // nice links for print magazine 2023
      {
        source: '/l/liechti',
        destination:
          '/a/portraet-schauspieler-manfred-liechti-spielt-kneubuehl',
        permanent: true,
      },
      {
        source: '/l/kmu',
        destination: '/a/kleiner-machtloser-unternehmer',
        permanent: true,
      },
      {
        source: '/l/keramik',
        destination: '/a/portraetkolumne-eva-vogelsang',
        permanent: true,
      },
      {
        source: '/l/nachtleben',
        destination: '/a/nachtleben',
        permanent: true,
      },
      {
        source: '/l/vercetti',
        destination: '/a/interview-geld-tommy-vercetti',
        permanent: true,
      },
      {
        source: '/l/lebenshof',
        destination:
          '/a/burrens-wollen-nicht-mehr-metzgen-lebenshof-liebewil-koeniz',
        permanent: true,
      },

      // nice links for print magazine 2022
      {
        source: '/l/downtown',
        destination: '/a/harrys-home-ostermundigen',
        permanent: true,
      },
      {
        source: '/l/lehrplan',
        destination: '/a/aufklarungsunterricht',
        permanent: true,
      },
      {
        source: '/l/1000grad',
        destination: '/a/ziegelei-rapperswil-ist-auf-russisches-gas-angewiesen',
        permanent: true,
      },
      {
        source: '/l/ruecken',
        destination: '/a/fragen-aus-dem-bern-movement-lab',
        permanent: true,
      },
      {
        source: '/l/klima',
        destination: '/a/kultur-und-klima',
        permanent: true,
      },
      {
        source: '/l/kulturklima',
        destination: '/a/kultur-und-klima',
        permanent: true,
      },
      {
        source: '/l/klimakultur',
        destination: '/a/kultur-und-klima',
        permanent: true,
      },
      {
        source: '/l/prixgaranti',
        destination: '/a/phanomen-prix-garanti',
        permanent: true,
      },
      // From old version to website builder version
      {
        source: '/abo',
        destination: '/mitmachen',
        permanent: true,
      },
      {
        source: '/politik',
        destination: '/a/tag/politik',
        permanent: true,
      },
      {
        source: '/gesellschaft',
        destination: '/a/tag/gesellschaft',
        permanent: true,
      },
      {
        source: '/kolumnen',
        destination: '/a/tag/kolumnen',
        permanent: true,
      },
      {
        source: '/hauptstadt-brief',
        destination: '/a/tag/hauptstadt-brief',
        permanent: true,
      },
      {
        source: '/a-stadtrat-brief',
        destination: '/a/tag/stadtrat-brief',
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

module.exports = composePlugins(...plugins)(nextConfig);
