<template>
  <v-alert type="info" color="primary">
    Das IT-Team führt gerade Unterhaltsarbeiten durch. Deshalb steht die {{ offlineFunction }}-Funktion derzeit nicht zur Verfügung.
    Wir freuen uns sehr, wenn Du in einer Weile nochmals vorbeischaust. Danke für Dein Verständnis.
  </v-alert>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
export default Vue.extend({
  name: 'UserInteractionOffline',
  props: {
    offlineFunction: {
      type: String as PropType<string>,
      required: true
    }
  }
})
</script>
