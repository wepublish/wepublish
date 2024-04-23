<template>
  <v-row
    v-if="publication"
    class="justify-center"
  >
    <!-- eventually show member ship -->
    <v-col
      v-if="propertyType === 'create-member-plan'"
      class="col-12 max-width-840 px-sm-0 pt-0"
    >
      <create-member-plan
        :icons-of-payment-providers="iconsOfPaymentProvider"
        :registration-form-fields="registrationFormFields"
        :hide-payment-slider="hidePaymentSlider"
        :hide-payment-methods="selectedMemberPlan && selectedMemberPlan.amountPerMonthMin === 0"
        :member-plan-tags="memberPlanTags"
        @changed:memberPlan="(newMemberPlan) => {selectedMemberPlan = newMemberPlan}"
      >
        <template #sliderLabel>
          <span class="font-size-16 abc-bold grey--text text--darken-4">
            Ich zahle für die «Hauptstadt» monatlich
          </span>
        </template>
        <template #selectSubscriptionTitle>
          <span class="headline">1. Abo wählen</span>
        </template>
        <template #selectAmountTitle>
          <span class="headline">2. Betrag wählen</span>
        </template>
        <template #addressTitle>
          <span class="headline">{{ calcTitleNumber(3) }}. Adresse erfassen</span>
        </template>
        <template #selectPaymentMethodTitle>
          <span class="headline">{{ calcTitleNumber(4) }}. Zahlungsmethode wählen</span>
        </template>
        <template #spamTitle>
          <span class="headline">{{ calcTitleNumber(5) }}. Spam-Schutz</span>
        </template>
      </create-member-plan>
    </v-col>

    <!-- eventually show login -->
    <v-col
      v-if="propertyType === 'login'"
      class="col-12 max-width-680 px-sm-0"
    >
      <login-form
        :redirect-path-on-login-success="redirectPathAfterLogin"
        allow-focus-input
        hide-registration
      />
    </v-col>

    <!-- eventually show user profile -->
    <v-col
      v-if="propertyType === 'profile'"
      class="col-12 px-sm-0"
    >
      <AuthenticationAuthenticatedComponent>
        <hs-profile />
      </AuthenticationAuthenticatedComponent>
    </v-col>

    <!-- eventually show deactivated abos -->
    <v-col
      v-if="propertyType === 'deactivated-abos'"
      class="col-12 max-width-680 px-sm-0"
    >
      <AuthenticationAuthenticatedComponent>
        <deactivated-subscriptions />
      </AuthenticationAuthenticatedComponent>
    </v-col>

    <!-- eventually show abo details -->
    <v-col
      v-if="propertyType === 'abo-details'"
      class="col-12 max-width-680 px-sm-0"
    >
      <AuthenticationAuthenticatedComponent>
        <user-subscription-view
          :id="$route.query.subscriptionId"
        />
      </AuthenticationAuthenticatedComponent>
    </v-col>

    <!-- eventually show open invoice -->
    <v-col
      v-if="propertyType === 'open-invoice'"
      class="col-12 max-width-680 px-sm-0"
    >
      <AuthenticationAuthenticatedComponent>
        <open-invoice
          :invoice-id="$route.query.invoiceId"
        />
      </AuthenticationAuthenticatedComponent>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { PropertyValue } from '~/sdk/wep/models/properties/Property'
import WepPublication from '~/sdk/wep/models/wepPublication/WepPublication'
import CreateMemberPlan from '~/sdk/wep/components/memberPlan/CreateMemberPlan.vue'
import LoginForm from '~/sdk/wep/components/authentication/LoginForm.vue'
import HsProfile from '~/components/profile/HsProfile.vue'
import DeactivatedSubscriptions from '~/sdk/wep/components/subscription/DeactivatedSubscriptions.vue'
import UserSubscriptionView from '~/sdk/wep/components/subscription/UserSubscriptionView.vue'
import OpenInvoice from '~/sdk/wep/components/invoice/OpenInvoice.vue'
import IconsOfPaymentProviders from '~/sdk/wep/models/paymentMethod/IconsOfPaymentProviders'
import IconsOfPaymentProvider from '~/sdk/wep/models/paymentMethod/IconsOfPaymentProvider'
import { RegistrationFormField } from '~/sdk/wep/interfacesAndTypes/Custom'
import MemberPlan from '~/sdk/wep/models/memberPlan/MemberPlan'

export default Vue.extend({
  name: 'PagePropertiesContent',
  components: { OpenInvoice, UserSubscriptionView, DeactivatedSubscriptions, HsProfile, LoginForm, CreateMemberPlan },
  props: {
    publication: {
      type: Object as PropType<undefined | WepPublication>,
      required: true,
      default: undefined
    }
  },
  data () {
    return {
      // custom properties
      HIDE_PAYMENT_SLIDER_PROP_NAME: 'hide-payment-slider',
      memberPlanTypeProperty: undefined as undefined | PropertyValue,
      selectedMemberPlan: undefined as undefined | MemberPlan,
      registrationFormFields: [
        {
          name: 'firstName',
          label: 'Vorname',
          rule: 'Bitte gib deinen Vornamen ein.',
          required: true
        },
        {
          name: 'name',
          label: 'Nachname',
          rule: 'Bitte gib deinen Nachnamen ein.',
          required: true
        },
        {
          name: 'streetAddress',
          label: 'Adresse',
          rule: 'Bitte gib deine Adresse ein.',
          required: true,
          cssClass: 'col-12'
        },
        {
          name: 'zipCode',
          label: 'PLZ',
          rule: 'Bitte gib deine Adresse ein.',
          required: true,
          cssClass: 'col-4 col-sm-2'
        },
        {
          name: 'city',
          label: 'Ort',
          rule: 'Bitte gib deinen Ort ein.',
          required: true,
          cssClass: 'col-8 col-sm-5'
        },
        {
          name: 'country',
          label: 'Land',
          rule: 'Bitte Land eingeben.',
          required: true,
          cssClass: 'col-12 col-sm-5'
        },
        {
          name: 'email',
          label: 'E-Mail',
          rule: 'Bitte gib deine E-Mail-Adresse ein.',
          required: true
        },
        {
          name: 'emailRepeat',
          label: 'E-Mail wiederholen',
          required: true
        }
      ] as RegistrationFormField[]
    }
  },
  computed: {
    propertyType (): undefined | PropertyValue {
      return this.publication?.properties?.findPropertyByKey('type')?.value
    },
    memberPlanTags (): undefined | PropertyValue[] {
      const memberPlanTag = this.publication?.properties?.findPropertyByKey('member-plan-tag')?.value
      return memberPlanTag ? [memberPlanTag] : undefined
    },
    hidePaymentSlider (): boolean {
      if (!this.selectedMemberPlan) {
        return true
      }
      if (this.selectedMemberPlan.tags?.find(tag => tag === this.HIDE_PAYMENT_SLIDER_PROP_NAME)) {
        return true
      }
      if (this.selectedMemberPlan.amountPerMonthMin === 0) {
        return true
      }
      return false
    },
    iconsOfPaymentProvider (): IconsOfPaymentProviders {
      const iconsOfPaymentProviders = new IconsOfPaymentProviders()
      iconsOfPaymentProviders.iconsOfPaymentProviders.push(
        new IconsOfPaymentProvider({
          paymentProviderSlug: 'stripe',
          iconNames: ['mastercard', 'visa']
        }),
        new IconsOfPaymentProvider({
          paymentProviderSlug: 'payrexx',
          iconNames: ['twint']
        }),
        new IconsOfPaymentProvider({
          paymentProviderSlug: 'payrexx-invoice-only',
          iconNames: ['invoice']
        }),
        new IconsOfPaymentProvider({
          paymentProviderSlug: 'bexio',
          iconNames: ['invoice']
        })
      )
      return iconsOfPaymentProviders
    },
    redirectPathAfterLogin (): string {
      // open invoice link (from mail)
      const invoiceId = this.$route.query.invoiceId
      const openInvoicePath = this.$config.OPEN_INVOICE_PATH
      if (!!invoiceId && typeof invoiceId === 'string' && openInvoicePath) {
        return openInvoicePath.replace(':invoiceId', invoiceId)
      }
      const redirectPathOnLoginSuccess = this.$route.query?.redirectPathOnLoginSuccess
      if (redirectPathOnLoginSuccess && typeof redirectPathOnLoginSuccess === 'string') {
        return redirectPathOnLoginSuccess
      }
      return '/'
    }
  },
  methods: {
    calcTitleNumber (number: number): number {
      const loggedIn = this.$store.getters['auth/loggedIn']
      let subtract = 0
      if (this.hidePaymentSlider) {
        subtract++
      }
      if (this.selectedMemberPlan?.amountPerMonthMin === 0 && number > 3) {
        subtract++
      }
      if (loggedIn) {
        subtract++
      }
      return number - subtract
    }
  }
})
</script>
