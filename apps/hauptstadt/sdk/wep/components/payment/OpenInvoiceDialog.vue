<template>
  <v-dialog
    :value="value"
    max-width="550"
    persistent
    @input="newValue => $emit('update:value', newValue)"
  >
    <v-card>
      <v-card-title>
        Sie haben eine offene oder angefangene Zahlung
      </v-card-title>
      <v-card-subtitle>
        Wir empfehlen, diese erst zu bezahlen, bevor Sie ein neues Abo lösen.
      </v-card-subtitle>
      <v-card-actions>
        <v-row
          class="justify-space-between row--dense"
        >
          <v-col class="col-12 col-md-auto text-center order-1 order-md-0">
            <v-btn
              outlined
              @click="$emit('checkout')"
            >
              Neues Abo lösen
            </v-btn>
          </v-col>
          <v-col class="col-12 col-md-auto text-center order-0 order-md-1">
            <nuxt-link
              v-if="unpaidInvoices && openInvoicePath"
              :to="openInvoicePath"
              class="text-decoration-none"
            >
              <v-btn color="primary" elevation="0">
                Offene Zahlung beenden
              </v-btn>
            </nuxt-link>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import Invoices from '~/sdk/wep/models/invoice/Invoices'

export default Vue.extend({
  name: 'OpenInvoiceDialog',
  props: {
    value: {
      type: Boolean as PropType<boolean>,
      required: true,
      default: false
    },
    invoices: {
      type: Object as PropType<undefined | Invoices>,
      required: false,
      default: undefined
    }
  },
  computed: {
    openInvoicePath (): undefined | string {
      const invoiceId = this.invoices?.getUnpaidInvoices()[0]?.id
      if (!invoiceId) { return undefined }
      const openInvoicePath = this.$config.OPEN_INVOICE_PATH
      if (!openInvoicePath) { return undefined }
      return openInvoicePath.replace(':invoiceId', invoiceId)
    },
    unpaidInvoices (): undefined | boolean {
      if (!this.invoices) {
        return undefined
      }
      return !!this.invoices.getUnpaidInvoices().length
    }
  }
})
</script>
