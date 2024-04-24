<template>
  <v-row>
    <v-col class="col-12">
      <div v-html="htmlBlock.html" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import HTMLBlock from '~/sdk/wep/models/block/HTMLBlock'
export default Vue.extend({
  name: 'HtmlBlockView',
  props: {
    htmlBlock: {
      type: Object as PropType<HTMLBlock>,
      required: true
    }
  }
})
</script>
