<template>
  <div>
    <v-row v-if="!formLoaded">
      <v-col class="col-12 text-center">
        <span class="mdi mdi-loading mdi-spin mdi-48px" />
      </v-col>
      <v-col class="col-12 text-center pt-0">
        Lade Daten des Zahlungsanbieters
      </v-col>
    </v-row>

    <form id="payment-form">
      <div id="payment-element">
        <!-- Elements will create form elements here -->
      </div>
    </form>

    <!-- submit button -->
    <v-row class="justify-center pt-9">
      <!-- cancel payment -->
      <v-col class="col-auto text-center">
        <v-btn
          v-if="!user"
          outlined
          @click="cancelPayment()"
        >
          <span class="fal fa-chevron-left mr-1" />
          zurück
        </v-btn>
      </v-col>

      <v-col class="col-auto text-center">
        <v-btn
          color="primary"
          elevation="0"
          :loading="loadingPayment"
          @click="pay()"
        >
          Jetzt bezahlen
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js'
import User from '~/sdk/wep/models/user/User'

export default Vue.extend({
  name: 'StripePayment',
  props: {
    intentSecret: {
      type: String as PropType<string>,
      required: true
    }
  },
  data () {
    return {
      stripe: null as Stripe | null,
      elements: null as StripeElements | null,
      formLoaded: false as boolean,
      loadingPayment: false as boolean
    }
  },
  computed: {
    user (): User {
      return this.$store.getters['auth/me']
    }
  },
  async mounted () {
    await this.loadStripeForm()
  },
  methods: {
    async loadStripeForm (): Promise<void> {
      this.formLoaded = false
      this.stripe = await loadStripe(this.$config.STRIPE_PUBLISHABLE_KEY)
      if (!this.stripe) {
        throw new Error('Stripe could not been loaded in StripePayment.vue')
      }
      const options = {
        clientSecret: this.intentSecret
      }
      this.elements = this.stripe.elements(options)
      const paymentElement = this.elements.create('payment')
      this.$nextTick(() => {
        paymentElement.mount('#payment-element')
        this.formLoaded = true
      })
    },
    cancelPayment (): void {
      this.$emit('update:intentSecret', undefined)
    },
    async pay (): Promise<void> {
      const successUrl = this.$config.PAYMENT_SUCCESS_URL
      if (!this.stripe) {
        this.$nuxt.$emit('alert', { title: 'Unerwarteter Fehler: Stripe-Instanz nicht verfügbar!', type: 'error' })
        throw new Error('Stripe instance not available in StripePayment.vue while calling the pay() method.')
      }
      if (!this.elements) {
        this.$nuxt.$emit('alert', { title: 'Unerwarteter Fehler: Elements nicht vorhanden!', type: 'error' })
        throw new Error('Elements not available in StripePayment.vue while calling pay() method.')
      }
      if (!successUrl) {
        this.$nuxt.$emit('alert', { title: 'Unerwarteter Fehler: Success-Url nicht vorhanden!', type: 'error' })
        throw new Error('Missing successUrl in StripePamyent.vue!')
      }
      this.loadingPayment = true
      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        confirmParams: {
          return_url: successUrl
        }
      })
      this.loadingPayment = false
      // refresh user's data
      await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', { vue: this })
      if (error) {
        this.$nuxt.$emit('alert', {
          title: error.message,
          type: 'error'
        })
      }
    }
  }
})
</script>
