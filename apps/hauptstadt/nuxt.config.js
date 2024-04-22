import extendRoutes from './configuration/extendRoutes'

export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - Hauptstadt',
    title: 'Hauptstadt',
    htmlAttrs: {
      lang: 'de'
    },
    meta: [
      {charset: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {name: 'format-detection', content: 'telephone=no'},
      {hid: 'description', name: 'description', content: 'Neuer Berner Journalismus'},
      // open graph
      {hid: 'og:title', property: 'og:title', content: 'Hauptstadt - Neuer Berner Journalismus'},
      {
        hid: 'og:description',
        property: 'og:description',
        content:
          'Aus Bern, für Bern, unabhängig, werbefrei, professionell und gemeinnützig: ' +
          'Die «Hauptstadt» ist die nachhaltige Alternative zum Konzernjournalismus. Jeder Franken, den wir einnehmen, fliesst in den Journalismus.'
      },
      {hid: 'og:url', property: 'og:url', content: 'https://hauptstadt.be'},
      {hid: 'og:image:type', property: 'og:image:type', content: 'image/png'},
      {
        hid: 'og:image',
        property: 'og:image',
        content:
          'https://hauptstadt-media01.wepublish.cloud/OGFd8Zf1d9ynMmD/rz_hauptstadt_icon_sw_positiv.png'
      },
      // twitter
      {hid: 'twitter:card', name: 'twitter:card', content: 'summary'},
      {hid: 'twitter:site', name: 'twitter:site', content: '@hauptstadt_be'},
      {
        hid: 'twitter:title',
        name: 'twitter:title',
        content: 'Hauptstadt - Neuer Berner Journalismus'
      },
      {
        hid: 'twitter:description',
        name: 'twitter:description',
        content:
          'Aus Bern, für Bern, unabhängig, werbefrei, professionell und gemeinnützig: ' +
          'Die «Hauptstadt» ist die nachhaltige Alternative zum Konzernjournalismus. Jeder Franken, den wir einnehmen, fliesst in den Journalismus.'
      },
      {
        hid: 'twitter:image',
        property: 'twitter:image',
        content:
          'https://hauptstadt-media01.wepublish.cloud/OGFd8Zf1d9ynMmD/rz_hauptstadt_icon_sw_positiv.png'
      },
      // favicon
      {name: 'apple-mobile-web-app-title', content: 'Hauptstadt'},
      {name: 'application-name', content: 'Hauptstadt'},
      {name: 'msapplication-TileColor', content: '#abd8da'},
      {name: 'msapplication-TileImage', content: '/mstile-144x144.png'},
      {name: 'theme-color', content: '#ffffff'}
    ],
    link: [
      // favicon
      {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
      {rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png'},
      {rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png'},
      {rel: 'manifest', href: '/site.webmanifest'},
      {rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#000000'}
    ]
  },
  publicRuntimeConfig: {
    ENVIRONMENT: process.env.ENVIRONMENT,
    BASE_URL: process.env.BASE_URL,
    WEP_API_URL_CLIENT: process.env.WEP_API_URL_CLIENT,
    WEP_API_URL_SSR: process.env.WEP_API_URL_SSR,
    WEP_CMS_URL: process.env.WEP_CMS_URL,
    REDIRECT_URL: process.env.REDIRECT_URL,
    OVERLAY_PASSWORD: process.env.OVERLAY_PASSWORD,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    PAYMENT_SUCCESS_URL: process.env.PAYMENT_SUCCESS_URL,
    PAYMENT_FAILURE_URL: process.env.PAYMENT_FAILURE_URL,
    TECHNICAL_ISSUER_MAIL: process.env.TECHNICAL_ISSUER_MAIL,
    USER_INTERACTION_OFFLINE: process.env.USER_INTERACTION_OFFLINE,
    DASHBOARD_PATH: '/p/profile',
    DEACTIVATED_ABOS_PATH: '/p/deactivated-abos',
    ABO_DETAILS_PATH: '/p/abo-details?subscriptionId=:subscriptionId',
    OPEN_INVOICE_PATH: '/p/open-invoice?invoiceId=:invoiceId',
    LOGIN_PATH: '/p/login',
    // PAYMENT METHODS
    PAYREXX_SUBSCRIPTION_SLUG: 'payrexx-subscription',
    AUTO_CHARGE_PAYMENT_METHOD_SLUGS: ['stripe'],
    // deprecated invoice only slug
    PAYREXX_INVOICE_ONLY_SLUG: 'payrexx-invoice-only',
    // HAS internal
    MEDIUM_SLUG: 'HAS'
  },
  privateRuntimeConfig: {},

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '~/assets/styles/layout.scss',
    '~/assets/styles/print.scss',
    '~/assets/styles/style.scss',
    '~/assets/styles/typography.scss'
    // './node_modules/@fortawesome/fontawesome-pro/css/all.css'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: ['~/plugins/apollo-config.ts'],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    // https://go.nuxtjs.dev/vuetify
    '@nuxtjs/vuetify'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/apollo',
    '@nuxtjs/sentry',
    [
      'nuxt-matomo',
      {
        matomoUrl: 'https://t.seccom.ch/',
        siteId: 8,
        trackerUrl: 'https://t.seccom.ch/seccomtp',
        scriptUrl: 'https://t.seccom.ch/seccomtj'
      }
    ],
    'cookie-universal-nuxt'
  ],

  sentry: {
    dsn: 'https://bf74cec7ad3b473196808c4586442063@sentry.seccom.ch/13', // Enter your project's DSN here
    // Additional Module Options go here
    // https://sentry.nuxtjs.org/sentry/options
    config: {
      environment: process.env.NODE_ENV
      // Add native Sentry config here
      // https://docs.sentry.io/platforms/javascript/guides/vue/configuration/options/
    }
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: '/'
  },

  router: {
    scrollBehavior: (to, _from, savedPosition) => {
      // make sure if user navigates back, the position of the page remains the same
      if (!savedPosition) {
        if (to.hash) {
          return {selector: to.hash}
        }
        return {x: 0, y: 0}
      }

      return new Promise(resolve => {
        const eventCb = () => {
          let position = savedPosition || {x: 0, y: 0}
          if (to.hash && document.querySelector(to.hash)) {
            position = {selector: to.hash}
          }
          window.removeEventListener('scrollToSavedPosition', eventCb)
          resolve(position)
        }
        window.addEventListener('scrollToSavedPosition', eventCb)
      })
    },
    extendRoutes(routes) {
      // redirects public article url (coming from peers)
      routes.push(...extendRoutes)
    }
  },

  // Vuetify module configuration: https://go.nuxtjs.dev/config-vuetify
  vuetify: {
    defaultAssets: false,
    treeShake: true,
    customVariables: ['~/assets/styles/variables.scss'],
    theme: {
      options: {customProperties: true},
      themes: {
        light: {
          primary: '#abd8da',
          secondary: '#abd8da',
          success: '#abd8da',
          violet: '#c9d7ed',
          yellow: '#f4e7bd',
          grey: '#e1dfe5',
          beige: '#f3ded0',
          anthrazit: '#1e1e1e'
        }
      }
    },
    breakpoint: {
      thresholds: {
        xs: 760,
        sm: 1000,
        md: 1480,
        lg: 2116
      },
      scrollBarWidth: 16
    },
    icons: {
      iconfont: 'fa'
    }
  },
  apollo: {
    clientConfigs: {
      default: '~/plugins/apollo-config.ts'
    }
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {}
}
