<template>
  <v-row class="pt-3">
    <v-col
      v-for="(listicle, listicleId) in listicleBlock.items"
      :key="listicleId"
      class="col-12 pb-10"
    >
      <v-row class="align-center">
        <!-- image -->
        <v-col
          v-if="listicle.image"
          class="col-5 pb-0 pr-0"
        >
          <v-img
            :src="listicle.image.getUrl($vuetify)"
            :aspect-ratio="3/2"
            eager
          >
            <template #placeholder>
              <img-loading-slot />
            </template>
          </v-img>
        </v-col>
        <!-- title -->
        <v-col
          class="title-30 tiempos-bold py-0 px-6"
          :class="{
            'col-7': listicle.image,
            'col-12': !listicle.image
          }"
        >
          {{ listicle.title }}
        </v-col>
        <!-- rich text -->
        <v-col
          v-if="getHtml(listicle)"
          class="col-12 tiempos"
        >
          <div
            class="bg-gradient pa-3"
            v-html="getHtml(listicle)"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Slate from '~/sdk/wep/classes/Slate'
import ListicleBlock from '~/sdk/wep/models/block/ListicleBlock'
import ImgLoadingSlot from '~/sdk/wep/components/img/ImgLoadingSlot.vue'
import Listicle from '~/sdk/wep/models/block/Listicle'

export default Vue.extend({
  name: 'ListicleBlockView',
  components: { ImgLoadingSlot },
  props: {
    listicleBlock: {
      type: Object as PropType<ListicleBlock>,
      required: true
    }
  },
  methods: {
    getHtml (listicle: Listicle): string | undefined {
      const richText = listicle.richText
      if (!richText) { return undefined }
      return new Slate({ fontClassHeadings: 'tiempos-semibold' }).toHtml(richText)
    }
  }
})
</script>
