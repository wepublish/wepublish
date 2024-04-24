<template>
  <v-row
    v-if="htmlContent"
    :class="{
      tiempos
    }"
  >
    <v-col class="col-12">
      <div
        class="line-height-1-6 rich-text-block zoomable-text"
        v-html="htmlContent"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import RichTextBlock from '~/sdk/wep/models/block/RichTextBlock'
import Slate from '~/sdk/wep/classes/Slate'

export default Vue.extend({
  name: 'RichTextBlockView',
  props: {
    richTextBlock: {
      type: Object as PropType<RichTextBlock>,
      required: true
    },
    tiempos: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  computed: {
    htmlContent (): string | undefined {
      const richText = this.richTextBlock.richText
      if (!richText) { return undefined }
      const fontClassHeadings = this.tiempos ? 'tiempos-bold' : 'abc-bold'
      return new Slate({ fontClassHeadings }).toHtml(richText)
    }
  }
})
</script>

<style lang="scss">
.rich-text-block p:last-child {
  margin-bottom: 0px !important;
}
</style>
