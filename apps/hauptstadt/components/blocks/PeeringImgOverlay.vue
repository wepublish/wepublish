<template>
  <v-row
    class="justify-end no-gutters peering-image-container w-100"
  >
    <v-img
      :src="peer.profile.logo.xsUrl"
      aspect-ratio="1"
      :max-width="maxWidth"
      class="border-radius-50"
    />
  </v-row>
</template>
<script lang="ts">
import { PropType } from 'vue'
import Peer from '~/sdk/wep/models/peer/Peer'

export default {
  name: 'PeeringImgOverlay',
  props: {
    peer: {
      type: Object as PropType<Peer>,
      required: true
    },
    maxWidth: {
      type: String as PropType<string>,
      required: true
    }
  }
}
</script>
<style lang="scss">
.peering-image-container {
  position: absolute;
  bottom: calc(3/2 * 4%);
  right: 4%;
}
</style>
