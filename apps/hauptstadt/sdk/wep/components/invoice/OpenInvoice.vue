<template>
  <v-row class="justify-space-between align-center">
    <v-col
      class="col-auto text-decoration-underline cursor-pointer"
      @click="showSubscriptionDetails = !showSubscriptionDetails"
    >
      Abo-Details <span v-if="showSubscriptionDetails">ausblenden</span><span v-else>anzeigen</span>
    </v-col>
    <!-- related subscription -->
    <v-col
      v-if="showSubscriptionDetails"
      class="col-12"
    >
      <user-subscription-preview
        v-if="subscription && !fetching"
        :subscription="subscription"
        cancel-btn
      />
      <v-skeleton-loader
        v-else
        type="card"
      />
    </v-col>
    <!-- single invoice -->
    <v-col class="col-12">
      <invoice-preview
        v-if="invoice && subscriptions && !fetching"
        :invoice="invoice"
        :subscriptions="subscriptions"
        :check-invoice-states="false"
      />
      <v-skeleton-loader
        v-else
        type="card"
      />
    </v-col>

    <v-col class="col-12 pt-12 text-center">
      <back-to-btn outlined>
        Zurück zum Profil
      </back-to-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Invoices from '~/sdk/wep/models/invoice/Invoices'
import Invoice from '~/sdk/wep/models/invoice/Invoice'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import UserSubscriptionPreview from '~/sdk/wep/components/subscription/UserSubscriptionPreview.vue'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import BackToBtn from '~/sdk/wep/components/helpers/BackToBtn.vue'
import InvoicePreview from '~/sdk/wep/components/invoice/InvoicePreview.vue'
import User from '~/sdk/wep/models/user/User'

export default Vue.extend({
  name: 'OpenInvoice',
  components: { InvoicePreview, BackToBtn, UserSubscriptionPreview },
  props: {
    invoiceId: {
      type: String as PropType<undefined | string>,
      required: true,
      default: undefined
    }
  },
  data () {
    return {
      showSubscriptionDetails: false as boolean
    }
  },
  async fetch () {
    // refresh subscriptions and invoices
    await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', { vue: this, lazyLoad: true })
  },
  computed: {
    me (): undefined | User {
      return this.$store.getters['auth/me']
    },
    invoices (): undefined | Invoices {
      return this.me?.invoices
    },
    invoice (): undefined | Invoice {
      if (!this.invoiceId) {
        throw new Error('No invoice id found')
      }
      // no invoices yet
      if (!this.invoices) {
        return undefined
      }
      return this.invoices.getInvoiceById(this.invoiceId)
    },
    subscriptions (): undefined | Subscriptions {
      return this.me?.subscriptions
    },
    subscription (): undefined | Subscription {
      if (!this.subscriptions) {
        return undefined
      }
      return this.subscriptions.subscriptions.find(subscription => subscription.id === this.invoice?.subscriptionID)
    },
    fetching (): boolean {
      return this.$store.getters['auth/fetching']
    }
  },
  fetchOnServer: false
})
</script>
