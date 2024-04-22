<template>
  <v-row
    v-if="buttons && buttons.links"
    class="no-gutters"
    :class="containerCss"
  >
    <v-col
      v-for="(buttonNavigation, buttonNavigationIndex) in btnsToDisplay"
      :key="buttonNavigationIndex"
      class="col-auto"
      :class="columnCss"
    >
      <div class="position-relative">
        <v-btn
          :outlined="buttonNavigationIndex % 2 === 1"
          :elevation="0"
          :large="$vuetify.breakpoint.mdAndUp"
          :x-large="$vuetify.breakpoint.lgAndUp"
          :class="[{
            'mr-4': buttonNavigationIndex % 2 === 0
          }, btnCss]"
          @click="openLink(buttonNavigation)"
        >
          {{ buttonNavigation.label }}
        </v-btn>

        <!-- open invoice hint -->
        <invoice-hint-menu
          v-if="unpaidInvoices && buttonNavigation.label.toLowerCase().includes('profil')"
          :show-claim="showInvoiceHintClaim"
          class="cursor-pointer"
          @clicked="openLink(buttonNavigation)"
        />
      </div>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import InvoiceHintMenu from '~/components/navigation/header/invoiceHint/InvoiceHintMenu.vue'
import User from '~/sdk/wep/models/user/User'

export default Vue.extend({
  name: 'MenuButtonEntries',
  components: { InvoiceHintMenu },
  props: {
    buttons: {
      type: Object as PropType<Navigation | undefined>,
      required: false,
      default: undefined
    },
    showInvoiceHintClaim: {
      type: Boolean as PropType<boolean | undefined>,
      required: false,
      default: false
    },
    containerCss: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    columnCss: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    btnCss: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    }
  },
  computed: {
    btnsToDisplay () {
      const loggedIn = this.$store.getters['auth/loggedIn']
      if (loggedIn) {
        return this.buttons?.links?.links.filter((link) => {
          return link.label.toLowerCase().includes('profil') || link.label.toLowerCase().includes('logout')
        })
      } else {
        return this.buttons?.links?.links.filter((link) => {
          return link.label.toLowerCase().includes('login') || link.label.toLowerCase().includes('abo')
        })
      }
    },
    unpaidInvoices (): boolean {
      const me: User | undefined = this.$store.getters['auth/me']
      return !!me?.invoices?.indicateOpenInvoices(this.$config.AUTO_CHARGE_PAYMENT_METHOD_SLUGS, me?.subscriptions)
    }
  },
  methods: {
    async openLink<T extends NavigationLink> (navigation: T): Promise<void> {
      let link = navigation.getFrontendLink()
      this.$store.commit('navigation/closeMenu')
      // logout
      if (navigation.label.toLowerCase().includes('logout')) {
        await this.$store.dispatch('auth/logout', {
          $apolloHelpers: this.$apolloHelpers,
          $router: this.$router
        })
        return
      }

      // login
      if (navigation.label.toLowerCase().includes('login')) {
        link += `?redirectPathOnLoginSuccess=${this.$route.path}`
      }
      if (link) {
        await this.$router.push(link)
      }
    }
  }
})
</script>
