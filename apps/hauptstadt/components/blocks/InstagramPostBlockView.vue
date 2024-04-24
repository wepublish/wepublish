<template>
  <v-row class="no-gutters">
    <!-- skeleton loader -->
    <v-col
      v-if="!instaLoaded"
      class="col-12"
    >
      <v-skeleton-loader
        type="image"
      />
    </v-col>
    <!-- tweet -->
    <v-col
      v-show="instaLoaded"
      class="col-12"
    >
      <blockquote
        class="instagram-media w-100"
        data-instgrm-captioned
        :data-instgrm-permalink="`https://www.instagram.com/p/${instagramPostBlock.postID}/`"
        data-instgrm-version="12"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import InstagramPostBlock from '~/sdk/wep/models/block/InstagramPostBlock'

export default Vue.extend({
  name: 'InstagramPostBlockView',
  props: {
    instagramPostBlock: {
      type: Object as PropType<InstagramPostBlock>,
      required: true
    }
  },
  data () {
    return {
      instaLoaded: false as boolean
    }
  },
  head () {
    return {
      script: [
        {
          hid: 'instagram',
          src: '//www.instagram.com/embed.js',
          defer: true,
          callback: () => { this.loadInsta() }
        } as any
      ]
    }
  },
  methods: {
    loadInsta () {
      if (window.instgrm) {
        window.instgrm.Embeds.process()
      }
      this.instaLoaded = true
    }
  }
})
</script>
