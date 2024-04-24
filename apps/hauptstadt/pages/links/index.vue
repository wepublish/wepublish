<template>
  <v-row class="justify-center">
    <v-col class="col-auto">
      Sie werden gleich weitergeleitet. <a :href="redirectUrl">Falls die Weiterleitung nicht funktioniert, klicken Sie hier.</a>
    </v-col>
  </v-row>
</template>

<script lang="ts">
/**
 * Simple redirect file
 */
import Vue from 'vue'
export default Vue.extend({
  name: 'RedirectLinks',
  data () {
    return {
      redirectUrl: 'https://linktr.ee/hauptstadt.be' as string
    }
  },
  beforeMount () {
    if (window) {
      window.location.href = this.redirectUrl
    }
  }
})
</script>
