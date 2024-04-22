<template>
  <h-image
    :image="imageBlock.image"
    :caption="imageBlock.caption"
    :aspect-ratio="aspectRatio"
    :is-main-image="isMainImage"
  />
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import ImageBlock from '~/sdk/wep/models/block/ImageBlock'
import HImage from '~/components/img/HImage.vue'

export default Vue.extend({
  name: 'ImageBlockView',
  components: { HImage },
  props: {
    imageBlock: {
      type: Object as PropType<ImageBlock>,
      required: true
    },
    isMainImage: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    aspectRatio: {
      type: Number as PropType<number | undefined>,
      required: false,
      default: undefined
    }
  }
})
</script>
