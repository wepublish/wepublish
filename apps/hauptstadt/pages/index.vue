<template>
  <v-row>
    <v-col class="col-12 pt-0 pt-md-3 pt-xl-7 px-4 px-sm-10 px-md-8 px-lg-16 pb-0">
      <blocks-view
        v-if="page"
        :blocks="page.blocks"
        :image-block-aspect-ratio="3/2"
      />
    </v-col>
    <!-- link to archive page -->
    <v-col
      v-if="page"
      class="col-12 pt-0 pb-16 text-center abc-thin"
    >
      <nuxt-link
        class="black--text font-size-16 font-size-md-21 font-size-lg-23 font-size-xl-36"
        to="/p/archiv"
      >
        Zu früheren Artikeln
      </nuxt-link>
    </v-col>

    <!-- loading animation -->
    <v-col
      v-else
      class="col-12"
    >
      <v-row>
        <v-col v-for="i in 6" :key="i" class="col-12 col-sm-4">
          <v-skeleton-loader type="card" style="overflow-y: hidden;" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'
import { MetaInfo } from 'vue-meta'
import Page from '~/sdk/wep/models/wepPublication/page/Page'
import PageService from '~/sdk/wep/services/PageService'
import BlocksView from '~/components/blocks/BlocksView.vue'

export default Vue.extend({
  name: 'IndexPage',
  components: { BlocksView },
  data () {
    return {
      seoPage: undefined as undefined | Page,
      page: undefined as undefined | Page,
      PAGE_SLUG: 'front'
    }
  },
  async fetch (): Promise<void> {
    // only fetch seo page server side
    if (typeof window !== 'undefined') { return }
    const page = await this.loadPage(true)
    if (!page) {
      return
    }
    this.seoPage = page
  },
  head (): MetaInfo {
    const page = this.seoPage instanceof Page ? this.seoPage : this.page
    if (!page) { return {} }
    return page.getSeoHead({
      description: page.description,
      baseUrl: this.$config.BASE_URL,
      fallBackImageUrlPath: require('~/assets/images/logo-with-claim.png')
    })
  },
  watch: {
    page: {
      handler () {
        // apply text zoom
        this.$nextTick(async () => {
          await this.$store.dispatch('textZoom/updateZoom', { vue: this })
        })
      },
      deep: false,
      immediate: true
    }
  },
  async beforeMount () {
    // fixes https://hauptstadt.atlassian.net/browse/HA-121
    await this.$vuetify.goTo(0, { duration: 0 })

    const page = await this.loadPage()
    if (!page) {
      return
    }
    this.page = page
    window.dispatchEvent(new Event('scrollToSavedPosition'))
  },
  methods: {
    async loadPage (reduced: boolean = false): Promise<Page | false> {
      return await new PageService({ vue: this }).getPage({ slug: this.PAGE_SLUG, reduced })
    }
  }
})
</script>
