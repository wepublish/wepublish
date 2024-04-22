<template>
  <v-row
    v-if="image"
    class="no-gutters justify-center himage"
  >
    <!-- image -->
    <v-col
      id="image-container"
      class="col-12 pb-0 position-relative"
      :class="{
        'pb-0': caption
      }"
    >
      <v-img
        v-if="image"
        v-resize="resized"
        :src="image.getUrl($vuetify)"
        :aspect-ratio="aspectRatioToApply"
        :max-height="maxHeight"
        :contain="!!maxHeight"
        eager
      >
        <template #placeholder>
          <img-loading-slot />
        </template>
      </v-img>
      <PeeringImgOverlay
        v-if="peer"
        :peer="peer"
        max-width="13%"
      />
    </v-col>
    <!-- caption -->
    <v-col
      class="pt-2 px-sm-0"
      :class="{
        'px-4': isMainImage,
        'col-12': !imgDescriptionWidth,
        'col-auto': imgDescriptionWidth
      }"
    >
      <img-description
        v-if="image"
        :image="image"
        :caption="caption"
        :style="{width: imgDescriptionWidth}"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import ImgLoadingSlot from '~/sdk/wep/components/img/ImgLoadingSlot.vue'
import ImgDescription from '~/components/img/ImgDescription.vue'
import WepImage from '~/sdk/wep/models/image/WepImage'
import Peer from '~/sdk/wep/models/peer/Peer'
import PeeringImgOverlay from '~/components/blocks/PeeringImgOverlay.vue'

export default Vue.extend({
  name: 'HImage',
  components: { PeeringImgOverlay, ImgDescription, ImgLoadingSlot },
  props: {
    image: {
      type: Object as PropType<WepImage>,
      required: true
    },
    isMainImage: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    caption: {
      type: String as PropType<string>,
      required: false,
      default: undefined
    },
    aspectRatio: {
      type: Number as PropType<number | undefined>,
      required: false,
      default: undefined
    },
    peer: {
      type: Object as PropType<Peer | undefined>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      maxHeight: undefined as undefined | number,
      imgDescriptionWidth: undefined as undefined | string
    }
  },
  computed: {
    aspectRatioToApply (): number {
      return this.aspectRatio || (this.image.width / this.image.height)
    }
  },
  mounted () {
    if (!this.aspectRatio) {
      this.setMaxHeight()
    }
  },
  methods: {
    resized (): void {
      setTimeout(() => {
        this.setMaxHeight()
      }, 200)
    },
    /**
     * sets a maximal height of the image of 2 / 3 of the width and aligns the image description
     */
    setMaxHeight (): void {
      if (this.aspectRatio) { return }
      const imageContainerWidth = document.getElementById('image-container')?.getBoundingClientRect()?.width
      if (imageContainerWidth) {
        const ratio = this.$vuetify.breakpoint.smAndUp ? 2 / 3 : 1
        this.maxHeight = imageContainerWidth * ratio
      } else {
        this.maxHeight = undefined
      }
      this.$nextTick(() => {
        this.setImgDescriptionWidth()
      })
    },
    /**
     * align the image caption.
     */
    setImgDescriptionWidth (): void {
      if (!this.maxHeight) {
        this.imgDescriptionWidth = undefined
        return
      }
      const imgWidth = this.image?.width
      const imgHeight = this.image?.height
      let maxImageWidth = document.getElementById('image-container')?.getBoundingClientRect()?.width
      if (!imgWidth || !imgHeight || !maxImageWidth) { return }
      const imgRatio = imgWidth / imgHeight
      const imageDescriptionWidth = imgRatio * this.maxHeight
      // removing padding from max image width
      const padding = this.$vuetify.breakpoint.smAndUp ? 0 : 32
      maxImageWidth = maxImageWidth - padding
      this.imgDescriptionWidth = imageDescriptionWidth > maxImageWidth ? `${maxImageWidth}px` : `${imageDescriptionWidth}px`
    }
  }
})
</script>
