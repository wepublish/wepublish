<template>
  <v-app>
    <site-overlay
      v-if="overlay"
      :redirect-url="redirectUrl"
      :password="password"
      @hide="hideOverlay()"
    />
    <!-- ml-md-n3 is to avoid scroll bar with is calculated to the view-port -->
    <v-main class="min-h-100-vh">
      <v-container
        fluid
      >
        <!-- menu content: ml-sm-n3 is a fix for shifted scroll bar width -->
        <h-menu
          class="z-index-4"
        />
        <!-- header ml-sm-n3 is a fix for shifted scroll bar width -->
        <h-header
          class="z-index-5"
        />
        <v-row
          class="no-gutters justify-center"
        >
          <boxed-content>
            <!-- content -->
            <Nuxt
              class="nuxt-content white"
            />
          </boxed-content>
        </v-row>
      </v-container>
      <wep-alert />
      <!-- paywall minimized desktop -->
      <minimized-paywall-square />
    </v-main>
    <h-footer />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue'
import HHeader from '../components/navigation/header/HHeader.vue'
import HFooter from '~/components/navigation/footer/HFooter.vue'
import HMenu from '~/components/navigation/header/HMenu.vue'
import SiteOverlay from '~/components/helpers/SiteOverlay.vue'
import BoxedContent from '~/components/layout/BoxedContent.vue'
import MinimizedPaywallSquare from '~/components/paywall/MinimizedPaywallSquare.vue'
import WepAlert from '~/sdk/wep/components/helpers/WepAlert.vue'

export default Vue.extend({
  name: 'DefaultLayout',
  components: { WepAlert, MinimizedPaywallSquare, BoxedContent, SiteOverlay, HFooter, HHeader, HMenu },
  middleware: ({ app }) => {
    // set cookie duration for one year via server side. workaround for safari ITP since: https://www.cookiestatus.com/safari/
    const apolloToken = app.$cookies.get('apollo-token')
    if (apolloToken) {
      const ONE_YEAR_IN_SEC = 365 * 24 * 60 * 60
      app.$cookies.set('apollo-token', apolloToken, {
        path: '/',
        maxAge: ONE_YEAR_IN_SEC,
        secure: true,
        sameSite: 'lax'
      })
    }
  },
  data () {
    return {
      overlay: false
    }
  },
  computed: {
    redirectUrl (): string | undefined {
      return this.$nuxt.context.$config.REDIRECT_URL
    },
    password (): string | undefined {
      return this.$nuxt.context.$config.OVERLAY_PASSWORD
    }
  },
  async mounted () {
    if (this.redirectUrl || this.password) {
      this.overlay = true
    }

    // fix 21.03.2022: load them sequentially to not call the apollo raise condition "Invariant Violation: Store reset while query was in flight"
    // caused when calling $apolloHelpers.onLogin() when other queries are performed
    try {
      await this.lazyLoadMenuNavigations()
      await this.login()
    } catch (e) {
      this.$sentry.captureException(e)
    }
  },
  methods: {
    async lazyLoadMenuNavigations () {
      await this.$store.dispatch('navigation/lazyLoadMenuNavigations', {
        vue: this
      })
    },
    async login () {
      await this.$store.dispatch('auth/login', {
        vue: this,
        $apollo: this.$apollo,
        $apolloHelpers: this.$apolloHelpers,
        $route: this.$route
      })
      // init the paywalls after login
      await this.$store.dispatch('paywall/initPaywalls', { $config: this.$config })
    },
    hideOverlay () {
      this.overlay = false
    }
  }
})
</script>

<style lang="scss">
@import 'assets/styles/variables';
@import '~vuetify/src/styles/settings/variables';

/**
  IMPORTANT: IMPORT layout here. Otherwise, the spacings (like pb-19) will be ignored due to vuetify space definitions
 */
@import 'assets/styles/layout';
@import 'assets/styles/print';

/*
  calc - 12px because of the v-container standard padding of 12px
 */
.nuxt-content {
  margin-top: calc(#{$header-height} - 12px);
  overflow-x: hidden;
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .nuxt-content {
    margin-top: calc(#{$header-height-sm-and-up} - 12px);
  }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .nuxt-content {
    margin-top: calc(#{$header-height-md-and-up} - 12px);
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .nuxt-content {
    margin-top: calc(#{$header-height-lg-and-up} - 12px);
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .nuxt-content {
    margin-top: calc(#{$header-height-xl-only} - 12px);
  }
}
</style>
