<template>
  <v-row class="align-center">
    <v-col
      class="col-12 col-md-6 offset-md-6 pb-2 order-1 order-md-0"
    >
      <slot name="label" />
    </v-col>
    <v-col
      class="col-12 col-md-6 pb-0 pt-4 pt-md-3 pb-md-9 order-0 order-md-1"
    >
      <v-slider
        :value="selectedAmountInCent"
        thumb-color="primary"
        :max="maxAmountInCents"
        :step="stepFactor"
        :min="minAmount"
        color="primary"
        track-color="primary"
        thumb-size="70"
        thumb-label="always"
        hide-details
        @input="setAmount"
      >
        <template #thumb-label="{ value }">
          <span v-if="!isSliderEndReached" class="font-weight-bold">{{ roundChf(value / 100) }} CHF</span>
          <v-row v-else>
            <v-col class="col-12 text-center font-weight-bold" style="line-height: 1.2em;">
              Freier Betrag eingeben
            </v-col>
          </v-row>
        </template>
      </v-slider>
    </v-col>
    <v-col class="col-12 col-md-6 py-0 order-2">
      <v-form
        ref="paymentAmountRef"
        @submit.prevent=""
      >
        <v-text-field
          :value="roundChf(selectedAmountInCent / 100)"
          prefix="CHF"
          suffix="jährlich abgerechnet."
          outlined
          :rules="[v => (!!v && v * 100 >= minAmount) || 'Der Minimalbetrag ist zu klein.']"
          @change="(value) => setAmount(value, true)"
        />
      </v-form>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import NumberHelper from '~/sdk/wep/classes/NumberHelper'
import { VForm } from '~/sdk/wep/interfacesAndTypes/Vuetify'

export default Vue.extend({
  name: 'PaymentSlider',
  props: {
    minAmount: {
      type: Number as PropType<number>,
      required: true
    },
    selectedAmountInCent: {
      type: Number as PropType<number>,
      required: true
    }
  },
  data () {
    return {
      maxAmountFactor: 15 as number,
      stepFactor: 100 as number
    }
  },
  computed: {
    maxAmountInCents (): number {
      return this.minAmount * this.maxAmountFactor
    },
    isSliderEndReached (): boolean {
      const factorA = (this.maxAmountInCents - this.minAmount) / this.stepFactor
      const flooredFactor = Math.floor(factorA)
      const maxSliderInCents = (flooredFactor * this.stepFactor) + this.minAmount
      return this.selectedAmountInCent >= maxSliderInCents
    }
  },
  methods: {
    // keep min amount
    setAmount (amount: number, calcInCHF: boolean = false): void {
      const amountInCents = calcInCHF ? amount * 100 : amount
      // handle higher amounts than min.
      if (amountInCents > this.maxAmountInCents) {
        this.maxAmountFactor = Math.ceil((amountInCents / this.minAmount)) + 1
      }
      this.$emit('update:selectedAmountInCent', amountInCents)
    },
    validate (): boolean {
      return (this.$refs.paymentAmountRef as VForm).validate()
    },
    roundChf (value: number): string {
      return NumberHelper.roundChf(value)
    }
  }
})
</script>
