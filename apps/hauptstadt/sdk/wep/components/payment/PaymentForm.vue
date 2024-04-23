<template>
  <v-row>
    <!-- payment form -->
    <v-col class="col-12">
      <v-form
        v-if="!intentSecret"
        ref="registrationFormRef"
        @submit.prevent=""
      >
        <!-- select amount you want to pay -->
        <!-- pr-1 workaround to not hide form borders -->
        <v-row
          v-if="settingsCorrect === true"
          class="pr-1"
        >
          <v-col
            v-if="memberPlan && !hidePaymentSlider"
            class="col-12 pb-9 pt-16 pt-md-6"
          >
            <v-row>
              <v-col
                class="col-12 pt-0"
              >
                <slot name="selectAmountTitle" />
              </v-col>
            </v-row>
            <v-row>
              <v-col class="pt-16 pt-md-6">
                <v-card outlined>
                  <v-card-text>
                    <payment-slider
                      v-if="!intentSecret"
                      ref="paymentSliderRef"
                      :min-amount="memberPlan.amountPerMonthMin"
                      :selected-amount-in-cent.sync="memberRegistration.monthlyAmount"
                    >
                      <template #label>
                        <slot name="sliderLabel" />
                      </template>
                    </payment-slider>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>

          <!-- user registration form -->
          <v-col
            v-if="!user"
            class="col-12 pt-8 pb-0"
          >
            <v-row>
              <v-col
                class="col-12 pb-6"
              >
                <slot name="addressTitle" />
              </v-col>
            </v-row>
            <registration-form
              :member-registration.sync="memberRegistration"
              :registration-form-fields="registrationFormFields"
            />
          </v-col>

          <!-- payment method selection -->
          <v-col
            v-if="availablePaymentMethods && availablePaymentMethods.length && !hidePaymentMethods"
            class="col-12 pt-8"
          >
            <v-row class="justify-center justify-sm-start">
              <!-- no payment method icons -->
              <v-col
                v-if="!iconsOfPaymentProviders"
                class="col-12 pb-0"
              >
                <v-alert
                  color="primary"
                  class="white--text text-center pt-4"
                >
                  <span class="fal fa-exclamation-triangle mr-2" />
                  Icons der Payment-Provider wurden nicht konfiguriert. Bitte wende dich an {{ $config.TECHNICAL_ISSUER_MAIL }}
                </v-alert>
              </v-col>

              <v-col
                v-else
                class="col-12"
              >
                <slot name="selectPaymentMethodTitle" />
              </v-col>

              <!-- auto renew payment possible -->
              <v-col
                v-for="(currentPaymentMethod, currentPaymentMethodId) in availablePaymentMethods"
                :key="currentPaymentMethodId"
                class="col-auto position-relative"
              >
                <v-btn
                  outlined
                  large
                  height="70px"
                  :set="currentPaymentProviderSlug = currentPaymentMethod.getPaymentMethods().getFirstPaymentMethod().slug"
                  :color="selectedPaymentProvider === currentPaymentProviderSlug ? 'primary ' : ''"
                  @click="selectPaymentProvider(currentPaymentMethod.getPaymentMethods().getFirstPaymentMethod())"
                >
                  <!-- payment provider icons -->
                  <payment-method-icons
                    v-if="iconsOfPaymentProviders"
                    :icons-of-payment-provider="iconsOfPaymentProviders.getPaymentProviderIconBySlug(currentPaymentProviderSlug)"
                  />
                </v-btn>
                <span
                  v-if="selectedPaymentProvider === currentPaymentProviderSlug"
                  class="fa fa-check fa-2x green--text check-container mb-1 mr-n1"
                />
              </v-col>

              <!-- auto renew checkbox -->
              <v-col
                v-if="selectedPaymentMethod && !selectedPaymentMethod.forceAutoRenewal"
                class="col-auto"
              >
                <v-checkbox
                  v-model="memberRegistration.autoRenew"
                  color="black"
                  label="Mit automatischer Abo-Erneuerung"
                />
              </v-col>
            </v-row>
          </v-col>

          <!-- challenge (only if not logged in) -->
          <v-col
            v-if="!user"
            class="col-12 pt-8"
          >
            <v-row>
              <v-col class="col-12 pb-0">
                <slot name="spamTitle" />
              </v-col>
            </v-row>
            <challenge-view
              ref="challengeView"
              :challenge.sync="challenge"
              :challenge-answer.sync="challengeAnswer"
              @enter="checkout()"
            />
          </v-col>

          <!-- submit button -->
          <v-col class="col-12 text-center pb-6">
            <v-row
              class="justify-center align-center"
              :class="{
                'pt-8 justify-sm-center': user && $vuetify.breakpoint.smAndUp
              }"
            >
              <v-col
                v-if="user"
                class="col-auto order-1 order-sm-0"
              >
                <back-to-btn
                  outlined
                  rounded
                  x-large
                >
                  Zurück zum Profil
                </back-to-btn>
              </v-col>

              <v-col
                v-if="!redirectLink"
                class="col-auto order-0 order-sm-1"
              >
                <v-btn
                  :loading="loadingCheckout"
                  elevation="0"
                  outlined
                  rounded
                  x-large
                  @click="checkout()"
                >
                  <span v-if="memberPlan.amountPerMonthMin === 0"><b>Gratis</b> Probe-Abo lösen</span>
                  <span v-else>
                    <b>CHF {{ yearlyAmount }}</b> <span v-if="user">&nbsp;Bestätigen &</span> &nbsp;Bezahlen
                  </span>
                </v-btn>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- no member plan -->
        <v-row v-else>
          <v-col class="col-12 py-0">
            <v-alert color="primary" class="white--text">
              {{ settingsCorrect }} Bitte wende dich an {{ $config.TECHNICAL_ISSUER_MAIL }}
            </v-alert>
          </v-col>
        </v-row>
      </v-form>

      <!-- off-session payment with stripe -->
      <v-row
        v-else
        class="justify-center"
      >
        <v-col class="col-12 headline">
          Kreditkartendaten eingeben
        </v-col>
        <v-col class="col-12 col-md-6">
          <stripe-payment
            :intent-secret.sync="intentSecret"
            :success-url="SUCCESS_URL"
          />
        </v-col>
      </v-row>
    </v-col>

    <!-- open invoices -->
    <open-invoice-dialog
      v-model="invoicesDialog"
      :invoices="invoices"
      @checkout="checkout(false, true)"
    />

    <!-- active subscriptions -->
    <active-subscription-dialog
      v-model="subscriptionsDialog"
      @checkout="checkout(false, false)"
    />

    <!-- show popup in case of redirect link -->
    <redirect-dialog
      v-model="redirectModal"
      :redirect-link="redirectLink"
      :logged-in="!!user"
    />
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import MemberService from '~/sdk/wep/services/MemberService'
import MemberPlan from '~/sdk/wep/models/memberPlan/MemberPlan'
import StripePayment from '~/sdk/wep/components/payment/StripePayment.vue'
import PaymentSlider from '~/sdk/wep/components/payment/PaymentSlider.vue'
import MemberRegistration from '~/sdk/wep/models/member/MemberRegistration'
import AvailablePaymentMethod from '~/sdk/wep/models/paymentMethod/AvailablePaymentMethod'
import PaymentMethod from '~/sdk/wep/models/paymentMethod/PaymentMethod'
import { VForm } from '~/sdk/wep/interfacesAndTypes/Vuetify'
import NumberHelper from '~/sdk/wep/classes/NumberHelper'
import PaymentMethodIcons from '~/sdk/wep/components/payment/PaymentMethodIcons.vue'
import IconsOfPaymentProviders from '~/sdk/wep/models/paymentMethod/IconsOfPaymentProviders'
import User from '~/sdk/wep/models/user/User'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import Invoices from '~/sdk/wep/models/invoice/Invoices'
import BackToBtn from '~/sdk/wep/components/helpers/BackToBtn.vue'
import { RegistrationFormField } from '~/sdk/wep/interfacesAndTypes/Custom'
import RegistrationForm from '~/sdk/wep/components/payment/RegistrationForm.vue'
import ChallengeView from '~/sdk/wep/components/authentication/ChallengeView.vue'
import Challenge from '~/sdk/wep/models/challenge/Challenge'
import ChallengeAnswer from '~/sdk/wep/models/challenge/ChallengeAnswer'
import ActiveSubscriptionDialog from '~/sdk/wep/components/payment/ActiveSubscriptionDialog.vue'
import RedirectDialog from '~/sdk/wep/components/payment/RedirectDialog.vue'
import OpenInvoiceDialog from '~/sdk/wep/components/payment/OpenInvoiceDialog.vue'

export default Vue.extend({
  name: 'PaymentForm',
  components: { OpenInvoiceDialog, RedirectDialog, ActiveSubscriptionDialog, ChallengeView, RegistrationForm, BackToBtn, PaymentMethodIcons, PaymentSlider, StripePayment },
  props: {
    memberPlan: {
      type: Object as PropType<MemberPlan>,
      required: true,
      default: null
    },
    iconsOfPaymentProviders: {
      type: Object as PropType<IconsOfPaymentProviders>,
      required: false,
      default: undefined
    },
    registrationFormFields: {
      type: Array as PropType<RegistrationFormField[]>,
      required: true,
      default: () => []
    },
    hidePaymentSlider: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    hidePaymentMethods: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  data () {
    return {
      SUCCESS_URL: undefined as undefined | string,
      FAILURE_URL: undefined as undefined | string,
      selectedPaymentProvider: undefined as undefined | string,
      intentSecret: undefined as string | undefined,
      redirectLink: undefined as undefined | string,
      redirectModal: false as boolean,
      memberRegistration: new MemberRegistration({}) as MemberRegistration,
      loadingCheckout: false as boolean,
      // invoices and subscriptions checks
      invoicesDialog: false as boolean,
      subscriptionsDialog: false as boolean,
      challenge: undefined as undefined | Challenge,
      challengeAnswer: new ChallengeAnswer({}) as ChallengeAnswer
    }
  },
  fetchOnServer: false,
  async fetch () {
    // refresh subscriptions and invoices
    await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', { vue: this })
  },
  computed: {
    // shortcut
    availablePaymentMethods (): AvailablePaymentMethod[] {
      return this.memberPlan?.getAvailablePaymentMethods().availablePaymentMethods
    },
    selectedPaymentMethod (): AvailablePaymentMethod | undefined {
      if (!this.selectedPaymentProvider) { return undefined }
      return this.memberPlan?.getAvailablePaymentMethods().getAvailablePaymentMethodBySlug(this.selectedPaymentProvider)
    },
    paymentMethod (): PaymentMethod | undefined {
      return this.selectedPaymentMethod?.getPaymentMethods()?.getFirstPaymentMethod()
    },
    user (): User {
      return this.$store.getters['auth/me']
    },
    yearlyAmount (): string {
      if (!this.memberRegistration?.monthlyAmount) { return '0' }
      return NumberHelper.roundChf(this.memberRegistration.monthlyAmount * 12 / 100)
    },

    // check for settings to be complete and hint the user
    settingsCorrect (): string | true {
      if (!this.memberPlan) { return 'Falsche WePublish-Einstellung: Member-Plan fehlt.' }
      if (!this.selectedPaymentMethod) { return 'Falsche WePublish-Einstellung: "Available-Payment-Method" fehlt.' }
      if (!this.paymentMethod) { return 'Falsche WePublish-Einstellung: "Payment-Method" fehlt.' }
      if (!this.SUCCESS_URL) { return 'Falsche Konfiguration: Env-Variable PAYMENT_SUCCESS_URL fehlt.' }
      if (!this.FAILURE_URL) { return 'Falsche Konfiguration: Env-Variable PAYMENT_FAILURE_URL fehlt.' }
      return true
    },
    mailQuery (): string | null | (string | null)[] {
      return this.$route.query.mail
    },
    firstNameQuery (): string | null | (string | null)[] {
      return this.$route.query.firstName
    },
    lastNameQuery (): string | null | (string | null)[] {
      return this.$route.query.lastName
    },
    invoices (): undefined | Invoices {
      return this.user?.invoices
    },
    unpaidInvoices (): undefined | boolean {
      return !!this.invoices?.getUnpaidInvoices().length
    },
    subscriptions (): undefined | Subscriptions {
      return this.user?.subscriptions
    },
    activeSubscriptions (): undefined | boolean {
      if (!this.subscriptions) {
        return undefined
      }
      return this.subscriptions.hasActiveSubscription()
    }
  },
  watch: {
    memberPlan () {
      if (!this.memberPlan) { return }
      this.memberRegistration.monthlyAmount = this.memberPlan.amountPerMonthMin
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    init () {
      // loading redirect url
      this.SUCCESS_URL = this.$config.PAYMENT_SUCCESS_URL
      this.FAILURE_URL = this.$config.PAYMENT_FAILURE_URL
      // select first payment provider (Stripe or Payrexx)
      this.selectedPaymentProvider = this.availablePaymentMethods[0]?.getPaymentMethods()?.getFirstPaymentMethod()?.slug
      // pre-select auto-renew
      this.memberRegistration.autoRenew = true
      if (!this.memberPlan) { return }
      this.memberRegistration.monthlyAmount = this.memberPlan.amountPerMonthMin
      if (typeof this.mailQuery === 'string') {
        this.memberRegistration.email = this.mailQuery
        this.memberRegistration.emailRepeat = this.mailQuery
      }
      if (typeof this.firstNameQuery === 'string') {
        this.memberRegistration.firstName = this.firstNameQuery
      }
      if (typeof this.lastNameQuery === 'string') {
        this.memberRegistration.name = this.lastNameQuery
      }
    },
    selectPaymentProvider (paymentMethod: PaymentMethod): void {
      this.selectedPaymentProvider = paymentMethod.slug
    },
    // init checkout process
    async checkout (checkInvoices: boolean = true, checkSubscriptions: boolean = true): Promise<boolean> {
      // check form
      if (!this.validateForms()) { return false }
      // indicating user to wait
      this.loadingCheckout = true
      // set required variables for endpoint
      this.setCheckoutVariables()
      const checksPassed = await this.checksBeforeCheckout(checkInvoices, checkSubscriptions)
      if (!checksPassed) {
        this.loadingCheckout = false
        return false
      }
      let response
      // existing logged in user
      if (this.user) {
        response = await new MemberService({ vue: this }).createSubscription({
          memberRegistration: this.memberRegistration
        })
        if (!response) {
          return false
        }
        return await this.redirectForPayment(response.intentSecret)
      } else {
        // register new user
        response = await new MemberService({ vue: this }).registerMemberAndReceivePayment({
          memberRegistration: this.memberRegistration
        })
        // something went wrong
        if (!response || !response?.session?.token) {
          // re-load the challenge
          (this.$refs.challengeView as unknown as any)?.$fetch()
          this.loadingCheckout = false
          return false
        }
        // login user
        await this.$store.dispatch('auth/loginWithSession', {
          vue: this,
          $apollo: this.$apollo,
          $apolloHelpers: this.$apolloHelpers,
          session: response.session.token
        })
        return await this.redirectForPayment(response.payment?.intentSecret)
      }
    },
    /**
     * Redirect user after intent secret received
     * @param redirectLink
     */
    async redirectForPayment (redirectLink: string | undefined): Promise<boolean> {
      if (!redirectLink) {
        // unknown error which should not occur
        this.$nuxt.$emit('alert', {
          title: `Leider konnte der Bezahl-Link nicht abgerufen werden. Bitte wende dich an ${this.$config.TECHNICAL_ISSUER_MAIL}`,
          type: 'error'
        })
        return false
      }

      this.loadingCheckout = false
      if (redirectLink.startsWith('https://') || redirectLink.startsWith('http://localhost')) {
        // if same hostname, do not open a new tab
        const redirectUrl = new URL(redirectLink)
        if (redirectUrl.hostname === window.location.hostname) {
          await this.$router.push(redirectUrl.pathname)
          return true
        }

        this.redirectLink = redirectLink
        this.redirectModal = true

        // fixes safari problem: https://stackoverflow.com/questions/20696041/window-openurl-blank-not-working-on-imac-safari
        setTimeout(() => {
          window.open(redirectLink, '_blank')
        }, 50)
        return true
      } else if (redirectLink.startsWith('no_charge')) { // trial subscriptions: non-charge-payment-adapter
        const successURL = this.$config.PAYMENT_SUCCESS_URL
        window.location.assign(successURL)
        return true
      } else {
        // it's an intent secret. Load inline stripe form by setting the intentSecret variable
        this.intentSecret = redirectLink
        return true
      }
    },
    validateForms () {
      const paymentSlider = this.$refs.paymentSliderRef as VForm | undefined
      const form = this.$refs.registrationFormRef as VForm
      if (!form.validate()) { return false }
      if (!paymentSlider && !this.hidePaymentSlider) { return false }
      if (paymentSlider && !paymentSlider.validate()) { return false }
      return true
    },
    // do some security checks before checkout
    async checksBeforeCheckout (checkInvoices: boolean = true, checkSubscriptions: boolean = true) {
      if (this.user) {
        if (checkInvoices && (await this.hasOpenInvoices())) {
          return false
        }
        this.invoicesDialog = false
        if (checkSubscriptions && (await this.hasActiveSubscriptions())) {
          return false
        }
        this.subscriptionsDialog = false
      }
      if (this.memberRegistration.monthlyAmount === undefined) {
        this.$nuxt.$emit('alert', {
          title: `Wir haben es mit einem technischen Fehler zu tun. Der Mindestbetrag existiert nicht. Bitte wende dich an ${this.$config.TECHNICAL_ISSUER_MAIL}`,
          type: 'error'
        })
        return false
      }
      if (this.memberRegistration.monthlyAmount < this.memberPlan.amountPerMonthMin) {
        this.$nuxt.$emit('alert', {
          title: 'Der monatliche Minimalbetrag ist zu klein.',
          type: 'error'
        })
        return false
      }
      // no payment method has been selected
      if (!this.selectedPaymentMethod) {
        this.$nuxt.$emit('alert', {
          title: `Die Payment-Methode ist ungültig. Bitte wende dich an ${this.$config.TECHNICAL_ISSUER_MAIL}`,
          type: 'error'
        })
        return false
      }

      if (this.selectedPaymentMethod.forceAutoRenewal && !this.memberRegistration.autoRenew) {
        this.$nuxt.$emit('alert', {
          title: `Das Attribut "auto-renewal" stimmt nicht mit der vorgegebenen Payment-Methode überein. Bitte wende dich an ${this.$config.TECHNICAL_ISSUER_MAIL}.`,
          type: 'error'
        })
        return false
      }
      return true
    },
    hasOpenInvoices () {
      // open dialog
      if (this.unpaidInvoices) {
        this.invoicesDialog = true
        return true
      }
      // no unpaid invoices nor active subscriptions
      return false
    },
    hasActiveSubscriptions () {
      // open dialog
      if (this.activeSubscriptions) {
        this.subscriptionsDialog = true
        return true
      }
      return false
    },
    // helper method for checkout
    setCheckoutVariables (): void {
      if (!this.paymentMethod?.id) {
        this.$nuxt.$emit('alert', {
          title: `Wir haben es mit einem technischen Fehler zu tun. Die PaymentMethodId existiert nicht. Bitte wende dich an ${this.$config.TECHNICAL_ISSUER_MAIL}`,
          type: 'error'
        })
        throw new Error('PaymentMethodId doesnt exist!')
      }
      if (!this.SUCCESS_URL || !this.FAILURE_URL) {
        throw new Error('SUCCESS_URL or FAILURE_URL not defined!')
      }
      this.memberRegistration.paymentMethodId = this.paymentMethod.id
      this.memberRegistration.memberPlanId = this.memberPlan.id
      this.memberRegistration.paymentPeriodicity = this.selectedPaymentMethod?.paymentPeriodicities[0]
      this.memberRegistration.successURL = this.SUCCESS_URL
      this.memberRegistration.failureURL = this.FAILURE_URL
      if (!this.user) {
        this.memberRegistration.challengeAnswer = this.challengeAnswer
      }
      // non-extendable member plans can't be auto-renewed
      if (!this.memberPlan.extendable) {
        this.memberRegistration.autoRenew = false
      }
      // force auto-renewal
      if (this.selectedPaymentMethod?.forceAutoRenewal) {
        this.memberRegistration.autoRenew = true
      }
    },
    // method to be used by parent components
    resetPayment () {
      this.intentSecret = undefined
    },
    roundChf (value: number): string {
      return NumberHelper.roundChf(value)
    }
  }
})
</script>

<style>
.check-container {
  position: absolute;
  bottom: 0px;
  right: 0px;
}
.position-relative {
  position: relative;
}
</style>
