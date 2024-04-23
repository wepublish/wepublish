<template>
  <v-row>
    <!-- ERROR: member plan type not available -->
    <v-col
      v-if="!loadingMemberPlans && !memberPlansByType.length"
      class="col-12"
    >
      <v-alert
        color="primary"
        class="white--text text-center"
      >
        <span class="mdi mdi-alert-outline mr-2" />
        Keine Memberpläne verfügbar. Bitte kopiere die Url und wende dich an {{ $config.TECHNICAL_ISSUER_MAIL }}
      </v-alert>
    </v-col>
    <!-- member plan type available -->
    <v-col
      v-else
      class="col-12"
    >
      <v-row>
        <v-col
          class="col-12 pt-2"
        >
          <slot name="selectSubscriptionTitle" />
        </v-col>

        <!-- select member plan -->
        <v-col
          class="col-12"
        >
          <v-row class="justify-center">
            <v-col
              v-for="(memberPlan, memberPlanId) in memberPlansByType"
              :key="memberPlan.id"
              class="col-12 col-sm-6 col-md-4 py-2"
              :class="{'grey--text': memberPlan.name.startsWith('(Ich kann')}"
            >
              <v-row class="no-gutters">
                <!-- button -->
                <v-col class="col-12">
                  <v-btn
                    outlined
                    :large="$vuetify.breakpoint.smAndUp"
                    :class="{
                      'secondary': memberPlanId === selectedMemberPlanId,
                      'grey--text': hasDisabledStyleTag(memberPlan) && memberPlan.id !== selectedMemberPlan.id,
                      'tiempos-bold text-transform-none-important': $config.MEDIUM_SLUG === 'HAS'
                    }"
                    :style="hasDisabledStyleTag(memberPlan) ? 'border: grey solid 1px !important;' : 'border: black solid 1px !important;'"
                    @click="selectedMemberPlanId = memberPlanId"
                  >
                    {{ memberPlan.name }}
                  </v-btn>
                </v-col>

                <v-col
                  v-if="selectedMemberPlan.id === memberPlan.id || $vuetify.breakpoint.smAndUp"
                  class="col-12 pt-3"
                >
                  <!-- image -->
                  <v-img
                    v-if="memberPlan && memberPlan.image"
                    :src="memberPlan.image.getUrl($vuetify)"
                    :aspect-ratio="3/2"
                    eager
                    :max-width="$vuetify.breakpoint.smAndDown ? '50%' : '100%'"
                    class="pb-2"
                  >
                    <template #placeholder>
                      <img-loading-slot />
                    </template>
                  </v-img>
                  <!-- description -->
                  <p
                    :class="[hasDisabledStyleTag(memberPlan) ? 'font-size-12' : '']"
                    v-html="memberPlan.getHtmlOfDescription({})"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-col>

        <!-- payment -->
        <v-col class="col-12">
          <payment-form
            v-if="selectedMemberPlan"
            ref="paymentFormRef"
            :member-plan="selectedMemberPlan"
            :icons-of-payment-providers="iconsOfPaymentProviders"
            :registration-form-fields="registrationFormFields"
            :hide-payment-slider="hidePaymentSlider"
            :hide-payment-methods="hidePaymentMethods"
          >
            <template #sliderLabel>
              <slot name="sliderLabel" />
            </template>
            <template #selectAmountTitle>
              <slot name="selectAmountTitle" />
            </template>
            <template #addressTitle>
              <slot name="addressTitle" />
            </template>
            <template #selectPaymentMethodTitle>
              <slot name="selectPaymentMethodTitle" />
            </template>
            <template #spamTitle>
              <slot name="spamTitle" />
            </template>
          </payment-form>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import PaymentForm from '~/sdk/wep/components/payment/PaymentForm.vue'
import MemberPlans from '~/sdk/wep/models/memberPlan/MemberPlans'
import MemberPlanService from '~/sdk/wep/services/MemberPlanService'
import MemberPlan from '~/sdk/wep/models/memberPlan/MemberPlan'
import { VForm } from '~/sdk/wep/interfacesAndTypes/Vuetify'
import ImgLoadingSlot from '~/sdk/wep/components/img/ImgLoadingSlot.vue'
import IconsOfPaymentProviders from '~/sdk/wep/models/paymentMethod/IconsOfPaymentProviders'
import { RegistrationFormField } from '~/sdk/wep/interfacesAndTypes/Custom'

export default Vue.extend({
  name: 'CreateMemberPlan',
  components: { ImgLoadingSlot, PaymentForm },
  props: {
    // What is the current memberPlan type? E.g. 'member'
    currentMemberPlanType: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    memberPlanTags: {
      type: Array as PropType<string[] | undefined>,
      required: false,
      default: undefined
    },
    // display member plan by slug. this overrules the "currentMemberPlanType"
    memberPlanBySlug: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
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
      memberPlans: new MemberPlans() as MemberPlans,
      loadingMemberPlans: true as boolean,
      selectedMemberPlanId: undefined as undefined | number
    }
  },
  computed: {
    // only show member plans of the current type
    memberPlansByType (): MemberPlan[] {
      // no member-plans
      if (!this.memberPlans.memberPlans.length) {
        return []
      }
      // show specific member-plan
      if (this.memberPlanBySlug) {
        return this.memberPlans.memberPlans.filter((memberPlan) => {
          return memberPlan.slug.toLowerCase() === this.memberPlanBySlug?.toLowerCase()
        })
      }
      // all member-plans
      if (!this.currentMemberPlanType) {
        return this.memberPlans.memberPlans
      }
      this.memberPlans.sortBySortOrder()
      // member-plans filtered by type
      return this.memberPlans.memberPlans.filter((memberPlan) => {
        return memberPlan.slug.toLowerCase().includes(this.currentMemberPlanType as string)
      })
    },
    selectedMemberPlan (): undefined | MemberPlan {
      if (this.selectedMemberPlanId === undefined) {
        return undefined
      }
      if (!this.memberPlansByType.length) {
        return undefined
      }
      return this.memberPlansByType[this.selectedMemberPlanId]
    }
  },
  watch: {
    selectedMemberPlanId () {
      const paymentForm = this.$refs.paymentFormRef as VForm & {resetPayment(): void}
      if (!paymentForm) {
        return
      }
      paymentForm.resetPayment()
    },
    selectedMemberPlan: {
      handler () {
        this.$emit('changed:memberPlan', this.selectedMemberPlan)
      },
      deep: true
    }
  },
  async mounted () {
    this.selectedMemberPlanId = 0
    await this.getMemberPlans()
  },
  methods: {
    async getMemberPlans (): Promise<void> {
      this.loadingMemberPlans = true
      let variables = { take: 100 }
      if (this.memberPlanTags?.length) {
        variables['filter'] = {
          tags: this.memberPlanTags
        }
      }
      const response = await new MemberPlanService({ vue: this }).getMemberPlans({
        variables
      })
      this.loadingMemberPlans = false
      if (!response) {
        return
      }
      this.memberPlans = response
    },
    hasDisabledStyleTag (memberPlan: MemberPlan): boolean {
      return memberPlan.hasTag('disabled-style')
    }
  }
})
</script>
