<template>
  <v-row
    class="justify-center align-center no-gutters mt-1 mx-n1"
  >
    <!-- missing icons -->
    <v-col
      v-if="!iconsOfPaymentProvider"
      class="col-auto"
    >
      Fehlende Icons für den Payment-Provider. Bitte wende Dich an {{ $config.TECHNICAL_ISSUER_MAIL }}
    </v-col>

    <!-- iterate icons -->
    <v-col
      v-if="iconsOfPaymentProvider"
      class="col-12"
    >
      <v-row>
        <v-col
          v-for="(iconName, iconIndex) in iconsOfPaymentProvider.iconNames"
          :key="iconIndex"
          class="col-auto px-1"
        >
          <img
            v-if="getIcon(iconName)"
            :src="getIcon(iconName)"
            class="payment-provider-icon"
          >
          <p
            v-else
            class="mb-0"
          >
            {{ iconName }}
          </p>
          <!-- invoice with text along: https://hauptstadt.atlassian.net/browse/HA-95 -->
          <p
            v-if="iconName === 'invoice'"
            class="mb-0 mt-n1 font-size-12"
          >
            Rechnung
          </p>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import IconsOfPaymentProvider from '~/sdk/wep/models/paymentMethod/IconsOfPaymentProvider'

export default Vue.extend({
  name: 'PaymentMethodIcons',
  props: {
    iconsOfPaymentProvider: {
      type: Object as PropType<IconsOfPaymentProvider>,
      required: false,
      default: undefined
    }
  },
  methods: {
    showIcon (iconName: string): boolean {
      return !!this.iconsOfPaymentProvider?.iconNames.find(tmpIconName => tmpIconName === iconName)
    },
    getIcon (iconName: string) {
      try {
        return require(`~/sdk/wep/assets/images/payment/${iconName}.svg`)
      } catch (e) {
        return false
      }
    }
  }
})
</script>

<style>
.payment-provider-icon {
  height: 40px;
}

.card-border {
  border: 1px grey solid;
  border-radius: 3px;
}

.font-size-12 {
  font-size: 12px;
}
</style>
