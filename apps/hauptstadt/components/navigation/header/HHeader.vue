<template>
  <div
    class="fixed-header ml-md-n3"
    :class="{
      'header-out': headerOut,
      'header-in': !headerOut
    }"
  >
    <v-row
      class="no-gutters justify-center white pt-2 d-print-none"
      :class="showDenseHeader ? 'header-height-dense pt-sm-3 pt-md-6 pt-lg-4 pt-xl-1' : 'header-height pt-sm-4 pt-md-7'"
    >
      <boxed-content
        id="header-position"
      >
        <v-row class="no-gutters align-center">
          <!-- burger menu -->
          <v-col
            class="col-2 cursor-pointer pl-6 pl-sm-12 mb-n1 mb-xl-0 font-size-25 font-size-md-30 font-size-lg-35 font-size-xl-45"
            @click="$store.commit('navigation/toggleMenu')"
          >
            <div class="position-relative">
              <span
                v-if="isMenuOpen"
                class="fal fa-times"
              />
              <span
                v-else
                class="fal fa-bars"
              />
              <!-- unpaid invoices -->
              <invoice-hint-header v-if="!isMenuOpen && unpaidInvoices" />
            </div>
          </v-col>
          <!-- main logo -->
          <v-col
            class="col-8 cursor-pointer"
            @click="clickLogo()"
          >
            <v-row class="justify-center no-gutters align-center">
              <v-col class="col-auto">
                <img
                  align="middle"
                  :class="showDenseHeader ? 'logo-width-dense' : 'logo-width'"
                  src="~/assets/images/logo.svg"
                >
              </v-col>
            </v-row>
          </v-col>
          <v-col
            align-self="end"
            class="text-right col-2 cursor-pointer pr-6 pr-sm-12 font-size-20 font-size-md-25 font-size-lg-30 font-size-xl-40"
            @click="$store.commit('navigation/toggleMenu')"
          >
            <span
              v-if="!showDenseHeader"
              class="fal fa-search"
            />
          </v-col>
        </v-row>

        <!-- claim -->
        <v-row
          class="justify-center cursor-pointer mt-0"
        >
          <v-col
            class="col-auto pt-0 pt-sm-2 pt-md-3 pt-lg-4 pt-xl-4"
            @click="clickLogo()"
          >
            <transition name="claim">
              <img
                v-if="!showDenseHeader"
                class="claim-width"
                src="~/assets/images/logo-claim.svg"
              >
            </transition>
          </v-col>
        </v-row>

        <!-- primary line -->
        <v-row
          v-if="$vuetify.breakpoint.smAndUp && !showDenseHeader"
        >
          <v-col
            v-if="!showPaywall || minimizedSquareView"
            class="col-12 px-7 pt-5 pt-sm-2 pt-md-4 pt-lg-6 pt-xl-9"
          >
            <div
              class="black-line-transition primary-line-1"
            />
          </v-col>
        </v-row>

        <!-- paywall -->
        <v-row
          v-if="showPaywall && !showDenseHeader && !minimizedSquareView && !hiddenByOtherPaywall"
          class="primary mx-0 mx-md-4"
        >
          <v-col class="col-12 px-4">
            <paywall-content :paywalls="paywalls" />
          </v-col>
        </v-row>
      </boxed-content>
    </v-row>

    <!-- primary line -->
    <v-row class="justify-center no-gutters d-print-none">
      <boxed-content>
        <div
          v-if="showDenseHeader"
          class="mt-n5 mt-sm-n4 mt-md-n6 mt-lg-n7 line-container white px-md-4"
        >
          <div class="white pt-2" />
          <div class="primary-line-1" />
        </div>

        <!-- paywall mobile -->
        <v-row
          v-if="showPaywall && showDenseHeader && !minimizedSquareView && !hiddenByOtherPaywall"
          class="primary mt-n6 mx-0 mx-md-4"
        >
          <v-col class="col-12 pt-8 px-4">
            <paywall-content :paywalls="paywalls" />
          </v-col>
        </v-row>
      </boxed-content>
    </v-row>

    <!-- print header -->
    <v-row class="no-gutters justify-center white py-8 my-0 d-none d-print-block">
      <v-row class="justify-center no-gutters align-center">
        <v-col class="col-auto">
          <img
            align="middle"
            class="logo-width"
            src="~/assets/images/logo.svg"
          >
        </v-col>
      </v-row>
      <v-row class="justify-center mt-0">
        <v-col class="col-auto">
          <img
            class="claim-width"
            src="~/assets/images/logo-claim.svg"
          >
        </v-col>
      </v-row>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import BoxedContent from '~/components/layout/BoxedContent.vue'
import PaywallContent from '~/components/paywall/PaywallContent.vue'
import Paywalls from '~/sdk/wep-cms/models/paywall/Paywalls'
import User from '~/sdk/wep/models/user/User'
import InvoiceHintHeader from '~/components/navigation/header/invoiceHint/InvoiceHintHeader.vue'

export default Vue.extend({
  name: 'HHeader',
  components: { InvoiceHintHeader, PaywallContent, BoxedContent },
  data () {
    return {
      PATH_IN_READ_MODE: ['/page', '/article', '/peer'],
      PATH_HIDES_PAYWALL: ['/p/login', '/p/abo', '/p/profile', '/p/deactivated-abos', '/p/abo-details', '/p/open-invoice'],
      hiddenByOtherPaywall: false,
      windowHeight: null as number | null,
      headerOut: false as boolean,
      lastScrollPosition: 0 as number
    }
  },
  computed: {
    // helper
    denseHeader (): boolean {
      return this.$store.getters['navigation/denseHeader']
    },
    isMenuOpen (): boolean {
      return this.$store.getters['navigation/menuOpen']
    },
    showDenseHeader (): boolean {
      return !this.isMenuOpen && this.denseHeader
    },
    isRouteInReadMode (): boolean {
      const currentPath = this.$route.path
      const isPathInReadMode = !!this.PATH_IN_READ_MODE.find(path => currentPath.startsWith(path))
      if (isPathInReadMode) {
        return true
      }
      return false
    },
    // user is logged in and has a valid subscription
    hasAccess (): boolean {
      return this.$store.getters['auth/hasAccess']
    },
    // the paywall instance from the store which is initialized in default.vue
    paywalls (): undefined | Paywalls {
      return (this.$store.getters['paywall/headerPaywalls'] as undefined | Paywalls)
    },
    // routes where paywall shouldn't be displayed
    routeHidesPaywall (): boolean {
      return !!this.PATH_HIDES_PAYWALL.find(currentPath => this.$route.path.startsWith(currentPath))
    },
    // user doesn't have a valid subscription, paywall content is available, menu is closed and route doesn't hide the paywall to be shown
    showPaywall (): boolean {
      return !this.hasAccess && !!this.paywalls?.hasPaywalls() && !this.isMenuOpen && !this.routeHidesPaywall
    },
    minimizedSquareView (): boolean {
      return this.showPaywall && !!this.paywalls?.isMinimized() && this.$vuetify.breakpoint.mdAndUp
    },
    me (): undefined | User {
      return this.$store.getters['auth/me']
    },
    unpaidInvoices (): boolean {
      return !!this.me?.invoices?.indicateOpenInvoices(this.$config.AUTO_CHARGE_PAYMENT_METHOD_SLUGS, this.me?.subscriptions)
    }
  },
  watch: {
    minimizedSquareView () {
      this.handleMinimizedSquareView()
    },
    hiddenByOtherPaywall () {
      this.handleMinimizedSquareView()
    }
  },
  mounted () {
    this.windowHeight = window.outerHeight
    window.addEventListener('scroll', this.updateScroll)
  },
  methods: {
    async clickLogo (): Promise<void> {
      if (this.isMenuOpen) {
        this.$store.commit('navigation/toggleMenu')
      }
      await this.$router.push('/')
      await this.$vuetify.goTo(0, { duration: 0 })
    },
    updateScroll () {
      const scrollPosition = window.scrollY
      this.handleDenseHeader(scrollPosition)
      this.handleScrollDirection(scrollPosition)
      this.avoidPaywallOverlay()
    },
    avoidPaywallOverlay (): void {
      const headerEl = document.getElementById('header-position')
      const paywallEl = document.getElementsByClassName('element-identifier-paywall-content')
      // in case paywall has to be shown, but it has been hidden on another route
      if (this.showPaywall && paywallEl.length < 1) {
        this.hiddenByOtherPaywall = false
        return
      }
      // elements not available
      if (paywallEl.length < 2 && !this.hiddenByOtherPaywall && !this.minimizedSquareView) {
        this.hiddenByOtherPaywall = false
        return
      }
      // elements not available
      if (!headerEl || !paywallEl) {
        return
      }
      const paywallRect = paywallEl[paywallEl.length - 1].getBoundingClientRect()
      const screenHeight = screen.height
      const bottomDiff = screenHeight - paywallRect.top
      const compareDiff = this.minimizedSquareView ? 0 : 150
      if (bottomDiff > compareDiff) {
        this.hiddenByOtherPaywall = true
      } else {
        this.hiddenByOtherPaywall = false
      }
    },
    handleMinimizedSquareView () {
      if (this.minimizedSquareView && !this.hiddenByOtherPaywall) {
        this.$nuxt.$emit('showMinimizedPaywallSquare')
      } else {
        this.$nuxt.$emit('hideMinimizedPaywallSquare')
      }
    },
    handleDenseHeader (scrollPosition: number): void {
      if (scrollPosition > 0) {
        this.$store.commit('navigation/setDenseHeader', true)
      } else {
        this.$store.commit('navigation/setDenseHeader', false)
      }
    },
    handleScrollDirection (scrollPosition: number): void {
      if (scrollPosition > 100 && scrollPosition > this.lastScrollPosition) {
        this.handleHeaderOut()
      } else if (scrollPosition < this.lastScrollPosition) {
        this.handleHeaderIn()
      }
      this.lastScrollPosition = scrollPosition
    },
    handleHeaderOut (): void {
      if (this.isMenuOpen || this.showPaywall) {
        this.headerOut = false
        return
      }
      if (this.isRouteInReadMode) {
        this.headerOut = true
      }
    },
    handleHeaderIn ():void {
      this.headerOut = false
    }
  }
})
</script>

<style lang="scss">
@import 'assets/styles/variables';
@import 'node_modules/vuetify/src/styles/settings/variables';

$logo-width: 220px;
$logo-width-dense: 220px;
$logo-width-sm-and-up: 350px;
$logo-width-md-and-up: 440px;
$logo-width-lg-and-up: 550px;
$logo-width-xl-only: 700px;
$logo-width-dense-md-and-up: 330px;

.fixed-header {
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
}

.header-out {
  top: -#{$header-height};
  transition: top 0.8s ease 0s;
}

.header-in {
  top: 0px;
  transition: top 0.8s ease 0s;
}

.header-height {
  height: $header-height;
}

.header-height-dense {
  transition: height 500ms ease;
  height: $header-height-dense;
  animation-name: header-height-dense-animation;
  animation-duration: 500ms;
  animation-fill-mode: forwards;
}

@keyframes header-height-dense-animation {
  from {
    clip-path: polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%);
  }
  to {
    clip-path: polygon(0% 0%, 0% 100%, 100% 50%, 100% 0%);
  }
}

.logo-width {
  width: $logo-width;
  transition: width 0.5s ease;
}

.logo-width-dense {
  width: $logo-width-dense;
  transition: width 0.5s ease;
}

/*
  PRIMARY LINE
 */
.line-container {
  width: 100%;
  box-shadow: 0px 7px 10px -3px rgb(0 0 0 / 18%);
  transform: rotate(-3.0deg);
}

/*
  CLAIM
 */
@keyframes claim-animation {
  from {
    width: 0px;
  }
  to {
    width: $logo-width;
  }
}

.claim-enter-active {
  animation: claim-animation 500ms forwards;
}
.claim-leave-active {
  animation: claim-animation 500ms reverse forwards;
}

.claim-width{
  width: $logo-width;
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .header-height {
    height: $header-height-sm-and-up;
  }

  .logo-width {
    width: $logo-width-sm-and-up;
    min-height: 40.58px;
  }

  .header-out {
    top: -#{$header-height-sm-and-up};
    transition: top 0.8s ease 0s;
  }

  .line-container {
    transform: rotate(-1.7deg);
  }

  @keyframes claim-animation {
    from {
      width: 0px;
    }
    to {
      width: $logo-width-sm-and-up;
    }
  }
  .claim-width{
    width: $logo-width-sm-and-up;
    min-height: 14.23px;
  }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .fixed-header {
    left: unset;
  }

  .header-height {
    height: $header-height-md-and-up;
  }

  .header-height-dense {
    height: $header-height-dense-md-and-up;
  }

  .header-out {
    top: -#{$header-height-md-and-up};
    transition: top 0.8s ease 0s;
  }

  .logo-width {
    width: $logo-width-md-and-up;
    min-height: 51.01px;
  }

  .logo-width-dense {
    width: $logo-width-dense-md-and-up;
  }

  .line-container {
    transform: rotate(-2deg);
  }

  /*
  CLAIM
 */
  @keyframes claim-animation {
    from {
      width: 0px;
    }
    to {
      width: $logo-width-md-and-up;
    }
  }
  .claim-width{
    width: $logo-width-md-and-up;
    min-height: 17.9px;
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {

  .header-height {
    height: $header-height-lg-and-up;
  }

  .logo-width {
    width: $logo-width-lg-and-up;
    min-height: 63.77px;
  }

  .header-out {
    top: -#{$header-height-lg-and-up};
    transition: top 0.8s ease 0s;
  }

  .line-container {
    transform: rotate(-1.7deg);
  }

  /*
  CLAIM
 */
  @keyframes claim-animation {
    from {
      width: 0px;
    }
    to {
      width: $logo-width-lg-and-up;
    }
  }
  .claim-width{
    width: $logo-width-lg-and-up;
    min-height: 22.37px;
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .logo-width {
    width: $logo-width-xl-only;
    min-height: 81.16px;
  }

  .header-height {
    height: $header-height-xl-only;
  }

  .header-out {
    top: -#{$header-height-xl-only};
    transition: top 0.8s ease 0s;
  }

  .line-container {
    transform: rotate(-1.3deg);
  }

  @keyframes claim-animation {
    from {
      width: 0px;
    }
    to {
      width: $logo-width-xl-only;
    }
  }
  .claim-width{
    width: $logo-width-xl-only;
    min-height: 28.47px;
  }
}
</style>
