<template>
  <div
    class="unpaid-invoice-container pl-4 pl-lg-4 pl-xl-5 error--text text-no-wrap mb-sm-n1 mb-md-n2 mb-lg-n3 mb-xl-n4"
  >
    <v-row class="align-center no-gutters flex-nowrap">
      <v-col class="col-auto font-size-17 font-size-sm-20 font-size-md-26 font-size-lg-34 font-size-xl-44">
        <span class="fas fa-exclamation-triangle" />
      </v-col>
      <v-col
        class="col-auto pl-1 hidden-sm-and-down font-weight-bold font-size-14 font-size-md-16 font-size-lg-17 font-size-xl-22"
        @click.stop="$router.push($config.DASHBOARD_PATH)"
      >
        Abo jetzt bezahlen
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'InvoiceHintHeader'
})
</script>

<style scoped lang="scss">
.unpaid-invoice-container {
  position: absolute;
  bottom: 0;
  left: 0;
}
</style>
