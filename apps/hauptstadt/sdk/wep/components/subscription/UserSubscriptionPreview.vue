<template>
  <v-card
    outlined
  >
    <v-img
      v-if="subscription.memberPlan.image"
      :src="subscription.memberPlan.image.url"
      max-height="200px"
      position="left"
      cover
    />
    <v-card-title>
      {{ subscription.memberPlan.name }}
    </v-card-title>

    <v-card-text>
      <!-- created at -->
      <div>
        <span class="fal fa-calendar-check mr-1" /> Abgeschlossen am {{ subscription.startsAt.format('DD.MM.YYYY') }}
      </div>
      <div>
        <span class="fal fa-key mr-1" />
        <span v-if="subscription.paidUntil">Läuft bis am {{ subscription.paidUntil.format('DD.MM.YYYY') }}</span>
        <span v-else>Abo ist unbezahlt.</span>
      </div>
      <!-- auto renewal -->
      <div v-if="subscription.autoRenew">
        <span class="fal fa-redo mr-1" /> Wird {{ subscription.getPaymentPeriodicityReadable() }} automatisch erneuert
      </div>
      <!-- cost -->
      <!-- https://hauptstadt.atlassian.net/browse/HA-147 -->
      <div
        v-if="$config.MEDIUM_SLUG !== 'HAS'"
      >
        <span class="fal fa-tag mr-1" /> Kostet CHF {{ NumberHelper.roundChf(subscription.monthlyAmount / 100) }} pro Monat
      </div>
      <!-- cancelled -->
      <div
        v-if="subscription.deactivation && subscription.deactivation.date"
      >
        <span class="fal fa-times mr-1" /> Gekündet per {{ subscription.deactivation.date.format('DD.MM.YYYY') }}.
        <span v-if="subscription.deactivation.reason">
          Grund: {{ subscription.deactivation.reason }}
        </span>
      </div>
      <!-- details btn -->
      <div
        v-if="detailsBtn && aboDetailsPath"
      >
        <nuxt-link :to="aboDetailsPath">
          <span class="fal fa-link mr-1" />
          Details & Zahlungen
        </nuxt-link>
      </div>

      <!-- payrexx subscription extra hint -->
      <v-col
        v-if="isPayrexxSubscription && $config.MEDIUM_SLUG === 'HAS'"
        class="col-12 pt-6 px-0"
      >
        <v-alert
          outlined
          type="info"
          color="#00000099"
          prominent
          dense
          class="mb-0"
        >
          <div class="font-size-14">
            Dein Abo, das du beim «Hauptstadt»-Crowdfunding per Kreditkarte bezahlt hast, wird ein Jahr nach der Zahlung automatisch verlängert, sofern du das Abo nicht kündigst. Du wirst drei Wochen vor der Zahlung eine Mail mit Informationen dazu erhalten.
          </div>
        </v-alert>
      </v-col>
    </v-card-text>
    <v-card-actions>
      <v-row class="row--dense justify-center justify-sm-space-between">
        <!-- extend the subscription -->
        <v-col
          class="col-auto order-sm-1"
        >
          <payment-btn-and-handler
            v-if="!subscription.deactivation && !isInvoiceOnly"
            :mode="openInvoice ? 'payOpenInvoice' : 'extendSubscription'"
            :subscription="subscription"
            :invoice="openInvoice"
            @setAutoPayrexxPayment="value => isPayrexxSubscription = value"
          />
        </v-col>

        <!-- cancel subscription -->
        <v-col class="col-auto order-sm-0">
          <v-btn
            v-if="!subscription.deactivation && cancelBtn"
            text
            @click="askToCancelSubscription(subscription)"
          >
            Abo künden
          </v-btn>
        </v-col>
      </v-row>
    </v-card-actions>

    <!-- ask again to really cancel the user subscription -->
    <v-dialog
      v-model="showDialog"
      scrollable
      width="500"
    >
      <v-card>
        <v-card-title>
          {{ subscription.memberPlan.name }} wirklich künden?
        </v-card-title>
        <v-card-text>
          Das Abo wird nicht mehr verlängert. Offene Rechnungen des Abos werden storniert.
        </v-card-text>
        <v-card-actions class="justify-space-between">
          <v-btn
            outlined
            :loading="$nuxt.$loading.show"
            @click="cancelUserSubscription()"
          >
            Künden
          </v-btn>
          <v-btn
            class="white--text"
            color="primary"
            @click="showDialog = false"
          >
            Abbrechen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import NumberHelper from '~/sdk/wep/classes/NumberHelper'
import SubscriptionService from '~/sdk/wep/services/SubscriptionService'
import User from '~/sdk/wep/models/user/User'
import PaymentBtnAndHandler from '~/sdk/wep/components/payment/PaymentBtnAndHandler.vue'
import Invoice from '~/sdk/wep/models/invoice/Invoice'
import {PaymentMethodId} from '~/sdk/wep/interfacesAndTypes/WePublish'
import {isInvoiceOnly} from '~/sdk/wep/classes/InvoiceOnlyHelper'

export default Vue.extend({
  name: 'UserSubscriptionPreview',
  components: { PaymentBtnAndHandler },
  props: {
    subscription: {
      type: Object as PropType<Subscription>,
      required: true
    },
    cancelBtn: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    detailsBtn: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  data () {
    return {
      showDialog: false as boolean,
      cancelInProgress: false as boolean,
      isPayrexxSubscription: false as boolean,
      NumberHelper
    }
  },
  computed: {
    user (): undefined | User {
      return this.$store.getters['auth/me']
    },
    aboDetailsPath (): undefined | string {
      const path = this.$config.ABO_DETAILS_PATH
      if (!path) {
        const exceptionMessage = 'ABO_DETAILS_PATH not defined in nuxt.config.js'
        if (this.$sentry) {
          this.$sentry.captureException(exceptionMessage)
        }
        throw new Error(exceptionMessage)
      }
      // replace subscription id placeholder
      return path.replace(':subscriptionId', this.subscription.id)
    },
    openInvoice (): undefined | Invoice {
      const invoices = this.user?.invoices
      if (!invoices) {
        return
      }
      return invoices.findOpenInvoiceBySubscriptionId(this.subscription.id)
    },
    // checks for payrexx only invoice and bexio subscriptions
    isInvoiceOnly (): boolean {
      return isInvoiceOnly({
        subscription: this.subscription,
        payrexxInvoiceOnlySlug: this.$config.PAYREXX_INVOICE_ONLY_SLUG
      })
    },
  },
  methods: {
    askToCancelSubscription () {
      this.showDialog = true
    },
    async cancelUserSubscription (): Promise<void> {
      const subscription = await new SubscriptionService({
        vue: this
      }).cancelUserSubscription({ subscriptionId: this.subscription.id })
      // close dialog
      this.showDialog = false

      if (!subscription) {
        this.$emit('canceledUserSubscriptionFailed')
      }
      // refresh subscriptions and invoices
      await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', { vue: this })
    }
  }
})
</script>
