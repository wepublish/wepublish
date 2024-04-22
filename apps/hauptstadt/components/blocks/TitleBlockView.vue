<template>
  <v-row
    v-if="titleBlock"
    :class="{
      tiempos
    }"
  >
    <!-- pre-title -->
    <v-col
      v-if="preTitle"
      class="abc abc-semibold font-size-18 font-size-sm-23 mt-7 pb-4"
    >
      <span class="px-1 beige">
        {{ preTitle }}
      </span>
    </v-col>
    <!-- title -->
    <v-col
      v-if="titleBlock.title"
      class="col-12 line-height-1-25 zoomable-text"
      :class="{
        'pt-0': preTitle,
        'pt-7': !preTitle,
        'pb-0': titleBlock.lead,
        'tiempos-bold title-30 title-sm-46': tiempos,
        'abc-bold title-30 title-sm-46': !tiempos,
        'pb-7': !titleBlock.lead
      }"
    >
      {{ titleBlock.title }}
    </v-col>
    <!-- lead -->
    <v-col
      v-if="titleBlock.lead"
      class="col-12 py-7 lead-20 lead-sm-26 line-height-1-35 zoomable-text"
      :class="[
        {
          'abc-light': !tiempos,
        },
        leadCssClass
      ]"
    >
      {{ titleBlock.lead }}
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import TitleBlock from '~/sdk/wep/models/block/TitleBlock'

export default Vue.extend({
  name: 'TitleBlockView',
  props: {
    titleBlock: {
      type: Object as PropType<TitleBlock>,
      required: true
    },
    preTitle: {
      type: String as PropType<String | undefined>,
      required: false,
      default: undefined
    },
    tiempos: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    leadCssClass: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    }
  }
})
</script>
