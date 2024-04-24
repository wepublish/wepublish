<template>
  <v-row>
    <v-col class="col-12">
      <div class="videoWrapper">
        <!-- Copy & Pasted from YouTube -->
        <iframe
          :src="youtubeUrl"
          width="560"
          height="349"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import YouTubeVideoBlock from '~/sdk/wep/models/block/YouTubeVideoBlock'

export default Vue.extend({
  name: 'YouTubeVideoBlockView',
  props: {
    youTubeVideoBlock: {
      type: Object as PropType<YouTubeVideoBlock>,
      required: true
    }
  },
  computed: {
    youtubeUrl (): string {
      return `https://www.youtube.com/embed/${this.youTubeVideoBlock.videoID}`
    }
  }
})
</script>

<style lang="scss">
.videoWrapper {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
}
.videoWrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
