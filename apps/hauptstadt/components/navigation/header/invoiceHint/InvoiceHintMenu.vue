<template>
  <div
    class="invoice-hint-menu-container"
    @click="$emit('clicked')"
  >
    <v-row class="flex-nowrap no-gutters align-start error--text mt-n4 mt-md-n5 mr-1">
      <v-col
        v-if="showClaim"
        class="col-auto font-weight-bold font-size-12 font-size-md-13 font-size-lg-14 mt-n1"
      >
        Abo jetzt bezahlen
      </v-col>
      <v-col
        class="col-auto font-size-20 font-size-md-24 font-size-lg-26"
      >
        <span class="fas fa-exclamation-triangle" />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
export default Vue.extend({
  name: 'InvoiceHintMenu',
  props: {
    showClaim: {
      type: Boolean as PropType<boolean | undefined>,
      required: false,
      default: false
    }
  }
})
</script>

<style scoped lang="scss">
.invoice-hint-menu-container {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
