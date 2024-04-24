<template>
  <v-row
    v-if="quoteBlock"
    class="py-10 quoteblock"
  >
    <!-- quote -->
    <v-col
      v-if="quoteBlock.quote"
      class="col-12 px-4 pb-4 pt-0 title-24 title-sm-30 text-center zoomable-text"
      :class="{
        'tiempos-bold-italic': tiempos,
        'abc-bold-italic': !tiempos
      }"
    >
      {{ quoteBlock.quote }}
    </v-col>

    <!-- author -->
    <v-col
      v-if="quoteBlock.author"
      class="col-12 px-4 pt-0 pb-0 text-center font-size-14 abc zoomable-text"
    >
      {{ quoteBlock.author }}
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import QuoteBlock from '~/sdk/wep/models/block/QuoteBlock'

export default Vue.extend({
  name: 'QuoteBlockView',
  props: {
    quoteBlock: {
      type: Object as PropType<QuoteBlock>,
      required: true
    },
    tiempos: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  }
})
</script>
