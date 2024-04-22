<template>
  <v-row
    class="fill-height ma-0 align-center justify-center white"
  >
    <v-progress-circular
      indeterminate
      color="primary"
    />
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'ImgLoadingSlot'
})
</script>
