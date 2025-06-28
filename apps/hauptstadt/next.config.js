//@ts-check

const {composePlugins, withNx} = require('@nx/next')
const wepNextConfig = require('../../libs/utils/website/src/lib/next.config')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.NODE_ENV === 'production' && !!process.env.ANALYZE_BUNDLE,
  openAnalyzer: false
})

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  ...wepNextConfig,
  publicRuntimeConfig: {
    env: {
      API_URL: process.env.API_URL || '',
      GA_ID: process.env.GA_ID || ''
    }
  },
  async redirects() {
    return [
      ...((await wepNextConfig.redirects?.()) ?? []),
      {
        source: '/profile/dashboard',
        destination: '/login',
        permanent: false,
        has: [
          {
            type: 'query',
            key: 'jwt'
          }
        ]
      },
      {
        source: '/profile/dashboard',
        destination: '/profile',
        permanent: false
      },
      // @TODO: CHECK (COPIED FROM BAJOUR)
      {
        source: '/a/:id((?!tag).*)/:slug',
        destination: '/a/:slug',
        permanent: false
      },
      // backwards compatibility for pages because of https://wepublish.atlassian.net/browse/HAS-23
      {
        source: '/p/:pageSlug',
        destination: '/:pageSlug',
        permanent: false
      },
      {
        source: '/l/etikette',
        destination: '/unsere-etikette',
        permanent: false
      },
      // backwards compatibility for pages and articles because of https://hauptstadt.atlassian.net/browse/HA-82
      // articles
      {
        source: '/article/:articleSlug',
        destination: '/a/:articleSlug',
        permanent: false
      },
      {
        source: '/page/:pageSlug',
        destination: '/:pageSlug',
        permanent: false
      },
      // nice links for print magazine 2024
      {
        source: '/l/auftakt',
        destination: '/a/geld-und-geist-one',
        permanent: false
      },
      {
        source: '/l/burgerbesitz',
        destination: '/a/geld-und-geist-two',
        permanent: false
      },
      {
        source: '/l/muehlheim',
        destination: '/a/interview-barbara-muehlheim-burgergemeinde-bern',
        permanent: false
      },
      {
        source: '/l/burgerfinanzen',
        destination: '/a/gute-rendite-wenig-klimaschutz',
        permanent: false
      },
      {
        source: '/l/burgerpolitik',
        destination: '/a/burgergemeinde-in-der-politik',
        permanent: false
      },
      {
        source: '/l/kulturburger',
        destination: '/a/kulturburger ',
        permanent: false
      },
      {
        source: '/l/burgerwald',
        destination: '/a/wald-burgergemeinde-bern-holz-klima-wandel-biodiversitaet-wirtschaft ',
        permanent: false
      },
      {
        source: '/l/zuenfte',
        destination: '/a/zuenfte',
        permanent: false
      },
      {
        source: '/l/einburgern',
        destination: '/a/einburgern-burgergemeinde',
        permanent: false
      },
      {
        source: '/l/burgerzukunft',
        destination: '/a/vorschlaege-zukunft-burgergemeinde-bern',
        permanent: false
      },

      // nice links for print magazine 2023
      {
        source: '/l/liechti',
        destination: '/a/portraet-schauspieler-manfred-liechti-spielt-kneubuehl',
        permanent: false
      },
      {
        source: '/l/kmu',
        destination: '/a/kleiner-machtloser-unternehmer',
        permanent: false
      },
      {
        source: '/l/keramik',
        destination: '/a/portraetkolumne-eva-vogelsang',
        permanent: false
      },
      {
        source: '/l/nachtleben',
        destination: '/a/nachtleben',
        permanent: false
      },
      {
        source: '/l/vercetti',
        destination: '/a/interview-geld-tommy-vercetti',
        permanent: false
      },
      {
        source: '/l/lebenshof',
        destination: '/a/burrens-wollen-nicht-mehr-metzgen-lebenshof-liebewil-koeniz',
        permanent: false
      },

      // nice links for print magazine 2022
      {
        source: '/l/downtown',
        destination: '/a/harrys-home-ostermundigen',
        permanent: false
      },
      {
        source: '/l/lehrplan',
        destination: '/a/aufklarungsunterricht',
        permanent: false
      },
      {
        source: '/l/1000grad',
        destination: '/a/ziegelei-rapperswil-ist-auf-russisches-gas-angewiesen',
        permanent: false
      },
      {
        source: '/l/ruecken',
        destination: '/a/fragen-aus-dem-bern-movement-lab',
        permanent: false
      },
      {
        source: '/l/klima',
        destination: '/a/kultur-und-klima',
        permanent: false
      },
      {
        source: '/l/kulturklima',
        destination: '/a/kultur-und-klima',
        permanent: false
      },
      {
        source: '/l/klimakultur',
        destination: '/a/kultur-und-klima',
        permanent: false
      },
      {
        source: '/l/prixgaranti',
        destination: '/a/phanomen-prix-garanti',
        permanent: false
      }
    ]
  }
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withBundleAnalyzer
]

module.exports = composePlugins(...plugins)(nextConfig)
