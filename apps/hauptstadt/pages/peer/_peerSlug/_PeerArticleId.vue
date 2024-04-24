<template>
  <wep-publication
    v-if="peerArticle"
    :publication="peerArticle"
    :peer="peer"
    class="font-size-17 font-size-sm-18"
    tiempos
  />
</template>

<script lang="ts">
import Vue from 'vue'
import { MetaInfo } from 'vue-meta'
import Article from '~/sdk/wep/models/wepPublication/article/Article'
import WepPublication from '~/components/wepPublication/WepPublication.vue'
import PeerArticleService from '~/sdk/wep/services/PeerArticleService'
import Peer from '~/sdk/wep/models/peer/Peer'
import PeerService from '~/sdk/wep/services/PeerService'

export default Vue.extend({
  name: 'PeerArticleId',
  components: { WepPublication },
  transition: 'default',
  data () {
    return {
      peerArticle: undefined as undefined | Article,
      seoPeerArticle: undefined as undefined | Article,
      peer: undefined as undefined | Peer
    }
  },
  async fetch (): Promise<void> {
    // only fetch seo page server side
    if (typeof window !== 'undefined') { return }
    this.seoPeerArticle = await this.loadPeerArticle(true)
  },
  head (): MetaInfo {
    if (!this.seoPeerArticle) {
      return {}
    }
    return this.seoPeerArticle.getSeoHead({
      description: this.seoPeerArticle?.lead,
      baseUrl: this.$config.BASE_URL,
      fallBackImageUrlPath: require('~/assets/images/logo-with-claim.png')
    })
  },
  async beforeMount () {
    // fixes https://hauptstadt.atlassian.net/browse/HA-121
    await this.$vuetify.goTo(0, { duration: 0 })
    await this.init()
    window.dispatchEvent(new Event('scrollToSavedPosition'))
  },
  methods: {
    async init (): Promise<void> {
      [this.peerArticle, this.peer] = await Promise.all(
        [
          this.loadPeerArticle(),
          this.loadPeer()
        ]
      )
    },
    async loadPeerArticle (reduced: boolean = false): Promise<undefined | Article> {
      const peerArticleId = this.$route.params.PeerArticleId
      const peerSlug: string = this.$route.params.peerSlug
      const response = await new PeerArticleService({ vue: this }).getPeerArticle({ peerArticleId, peerSlug, reduced })
      if (!response) {
        return undefined
      }
      return response
    },
    async loadPeer (): Promise<undefined | Peer> {
      const slug: string = this.$route.params.peerSlug
      const peer = await new PeerService({ vue: this }).getPeer({ slug })
      if (!peer) { return undefined }
      return peer
    }
  }
})
</script>
