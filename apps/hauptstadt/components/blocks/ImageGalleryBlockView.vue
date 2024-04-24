<template>
  <v-row
    v-if="imageGalleryBlock"
  >
    <v-col
      v-if="imageGalleryBlock.images"
      class="col-12 px-0"
    >
      <v-carousel
        hide-delimiters
        height="auto"
      >
        <v-carousel-item
          v-for="(galleryImage, galleryImageId) in imageGalleryBlock.images"
          :key="galleryImageId"
        >
          <v-row class="no-gutters fill-height align-center">
            <!-- align center image in case of different ratios -->
            <v-col class="col-12">
              <v-row class="no-gutters fill-height">
                <!-- image -->
                <v-col class="col-12">
                  <h-image
                    :image="galleryImage.image"
                    :caption="galleryImage.caption"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-carousel-item>
      </v-carousel>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import ImageGalleryBlock from '~/sdk/wep/models/block/ImageGalleryBlock'
import HImage from '~/components/img/HImage.vue'

export default Vue.extend({
  name: 'ImageGalleryBlockView',
  components: { HImage },
  props: {
    imageGalleryBlock: {
      type: Object as PropType<ImageGalleryBlock>,
      required: true
    }
  }
})
</script>
