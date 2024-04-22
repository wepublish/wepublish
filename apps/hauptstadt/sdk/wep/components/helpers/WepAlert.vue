<template>
  <div
    class="alert-container z-index-5"
    style="z-index: 999;"
  >
    <v-row
      class="justify-center"
    >
      <v-col class="col-auto">
        <v-alert
          v-for="(alert, alertIndex) in alerts"
          :key="alertIndex"
          :color="alert.type"
          dismissible
        >
          {{ alert.title }}
        </v-alert>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import IAlert from '~/sdk/wep/models/alert/IAlert'

export default Vue.extend({
  name: 'WepAlert',
  data () {
    return {
      alerts: [] as IAlert[]
    }
  },
  mounted () {
    this.$nuxt.$on('alert', (alert: IAlert) => {
      this.alerts.push(alert)
      setTimeout(() => {
        this.alerts.splice(0, 1)
      }, 10000)
    })
  },
  beforeDestroy () {
    this.$nuxt.$off('alert')
  }
})
</script>

<style>
.alert-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
}
</style>
