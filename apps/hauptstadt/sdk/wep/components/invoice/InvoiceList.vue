<template>
  <v-row class="justify-center">
    <!-- loading -->
    <v-col
      v-if="fetching || !subscriptions"
      class="col-12"
    >
      <v-skeleton-loader
        type="image"
      />
    </v-col>

    <!-- iterate invoices -->
    <v-col
      v-else-if="filteredInvoices.length"
      class="col-12"
    >
      <v-row>
        <v-col
          v-for="(invoice, invoiceIndex) in filteredInvoices"
          :key="invoiceIndex"
          class="col-12"
        >
          <invoice-preview
            v-if="subscriptions"
            :invoice="invoice"
            :subscriptions="subscriptions"
            :check-invoice-states="fetching"
          />
        </v-col>
      </v-row>
    </v-col>

    <!-- no invoices -->
    <v-col v-else class="col-12">
      <slot name="noInvoices" />
      <span v-if="!$slots.noInvoices">Keine Zahlungen</span>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Invoices from '~/sdk/wep/models/invoice/Invoices'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import Invoice from '~/sdk/wep/models/invoice/Invoice'
import InvoicePreview from '~/sdk/wep/components/invoice/InvoicePreview.vue'
import User from '~/sdk/wep/models/user/User'

export default Vue.extend({
  name: 'InvoiceList',
  components: { InvoicePreview },
  layout: 'profile-layout',
  props: {
    subscriptions: {
      type: Object as PropType<undefined | Subscriptions>,
      required: false,
      default: undefined
    },
    filter: {
      type: String as PropType<undefined | 'open' | 'subscriptionId'>,
      required: false,
      default: undefined
    },
    filterSubscriptionId: {
      type: String as PropType<undefined | string>,
      required: false,
      default: undefined
    }
  },
  computed: {
    user (): undefined | User {
      return this.$store.getters['auth/me']
    },
    invoices (): undefined | Invoices {
      return this.user?.invoices
    },
    filteredInvoices (): undefined | Invoice[] {
      const invoicesArray = this.invoices?.getInvoices() || []
      if (!this.filter) {
        return invoicesArray
      }
      if (this.filter === 'open') {
        return invoicesArray.filter(invoice => !invoice.isPaid() && !invoice.isCancelled())
      }
      if (this.filter === 'subscriptionId' && this.filterSubscriptionId) {
        return invoicesArray.filter(invoice => invoice.subscriptionID === this.filterSubscriptionId)
      }
      return undefined
    },
    fetching (): boolean {
      return this.$store.getters['auth/fetching']
    }
  },
  fetchOnServer: false
})
</script>
