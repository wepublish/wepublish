<template>
  <v-row class="no-gutters">
    <!-- skeleton loader -->
    <v-col
      v-if="!tweetLoaded"
      class="col-12"
    >
      <v-skeleton-loader
        type="image"
      />
    </v-col>
    <!-- tweet -->
    <v-col
      v-show="tweetLoaded"
      class="col-12 w-100"
    >
      <div id="twitterElement" class="w-100" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import TwitterTweetBlock from '~/sdk/wep/models/block/TwitterTweetBlock'

export default Vue.extend({
  name: 'TwitterTweetBlockView',
  props: {
    twitterTweetBlock: {
      type: Object as PropType<TwitterTweetBlock>,
      required: true
    }
  },
  data () {
    return {
      tweetLoaded: false as boolean
    }
  },
  head () {
    return {
      script: [
        {
          hid: 'twitter',
          src: '//platform.twitter.com/widgets.js',
          defer: true,
          callback: () => { this.loadTweet() }
        } as any
      ]
    }
  },
  methods: {
    loadTweet (): void {
      if (window?.twttr) {
        const twitterEl = document.getElementById('twitterElement')
        window.twttr.widgets.createTweet(this.twitterTweetBlock.tweetID, twitterEl)
        this.tweetLoaded = true
      }
    }
  }
})
</script>
