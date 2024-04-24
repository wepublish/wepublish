<template>
  <client-only>
    <wep-publication
      v-if="article"
      :publication="article"
      class="font-size-17 font-size-sm-18"
      tiempos
    />
  </client-only>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { MetaInfo } from 'vue-meta'
import Article from '~/sdk/wep/models/wepPublication/article/Article'
import ArticleService from '~/sdk/wep/services/ArticleService'
import WepPublication from '~/components/wepPublication/WepPublication.vue'

export default Vue.extend({
  name: 'ArticleSlug',
  components: { WepPublication },
  transition: 'default',
  props: {
    token: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      seoArticle: undefined as Article | undefined,
      article: undefined as Article | undefined
    }
  },
  async fetch (): Promise<void> {
    // only fetch seo page server side
    if (typeof window !== 'undefined') { return }
    this.seoArticle = await this.loadArticle(true)
  },
  head (): MetaInfo {
    if (!this.seoArticle) {
      return {}
    }
    return this.seoArticle.getSeoHead({
      description: this.seoArticle?.lead,
      baseUrl: this.$config.BASE_URL,
      fallBackImageUrlPath: require('~/assets/images/logo-with-claim.png')
    })
  },
  async beforeMount () {
    // fixes https://hauptstadt.atlassian.net/browse/HA-121
    await this.$vuetify.goTo(0, { duration: 0 })
    this.article = await this.loadArticle()
    window.dispatchEvent(new Event('scrollToSavedPosition'))
  },
  methods: {
    async loadArticle (reduced: boolean = false): Promise<undefined | Article> {
      const articleSlug = this.$route.params.ArticleSlug
      const articleService = new ArticleService({ vue: this })
      const response = await articleService.getArticle({ token: this.token, slug: articleSlug, reduced })
      if (!response) {
        return undefined
      }
      return response
    }
  }
})
</script>
