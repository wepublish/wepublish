<template>
  <v-row
    class="justify-center"
  >
    <v-col class="col-auto text-center font-size-30">
      <div>
        Einen Moment. Wir loggen dich ein.
      </div>
      <v-row class="justify-center mt-3">
        <v-col class="col-8">
          <v-progress-linear
            color="primary"
            indeterminate
            rounded
            height="10"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'LoginInProgress'
})
</script>
