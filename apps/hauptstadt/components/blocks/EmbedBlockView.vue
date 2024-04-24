<template>
  <v-row
    v-if="embedBlock"
  >
    <v-col class="col-12">
      <iframe
        :src="embedBlock.url"
        width="100%"
        :height="embedBlock.height"
        style="border: 0px;"
        :style="embedBlock.styleCustom"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import EmbedBlock from '~/sdk/wep/models/block/EmbedBlock'

export default Vue.extend({
  name: 'EmbedBlockView',
  props: {
    embedBlock: {
      type: Object as PropType<EmbedBlock>,
      required: true
    }
  }
})
</script>
