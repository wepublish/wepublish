<template>
  <div class="caption-12 caption-sm-14 pl-sm-1 pl-md-0">
    <!-- caption -->
    <span v-if="caption" class="abc zoomable-text">{{ caption }}</span>
    <!-- author, licence, original -->
    <span class="abc-light zoomable-text">
      (Bild: {{ image.source }}<span v-if="image.license">, Lizenz: {{ image.license }}</span>)
    </span>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import WepImage from '~/sdk/wep/models/image/WepImage'

export default Vue.extend({
  name: 'ImgDescription',
  props: {
    image: {
      type: Object as PropType<WepImage>,
      required: true
    },
    caption: {
      type: String as PropType<string>,
      required: false,
      default: undefined
    }
  }
})
</script>
