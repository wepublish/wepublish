<template>
  <wep-publication
    v-if="page"
    :publication="page"
    :pagination="pagination"
    @goToPage="goToPage"
  />
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { MetaInfo } from 'vue-meta'
import Page from '~/sdk/wep/models/wepPublication/page/Page'
import PageService from '~/sdk/wep/services/PageService'
import WepPublication from '~/components/wepPublication/WepPublication.vue'
import ArticleService from '~/sdk/wep/services/ArticleService'
import { ArticleFilter, SortOrder } from '~/sdk/wep/interfacesAndTypes/WePublish'
import Articles from '~/sdk/wep/models/wepPublication/article/Articles'
import Pagination from '~/sdk/wep/models/wepPublication/Pagination'
import PhraseService from '~/sdk/wep/services/PhraseService'

export default Vue.extend({
  name: 'PageSlug',
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
      seoPage: undefined as undefined | Page,
      page: undefined as undefined | Page,
      // props for rubric mode
      pagination: new Pagination({}) as Pagination,
      rubricProperty: undefined as undefined | string,
      teaserCount: undefined as undefined | number
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
    if (!this.seoPage) {
      return {}
    }
    return this.seoPage.getSeoHead({
      description: this.seoPage.description,
      baseUrl: this.$config.BASE_URL,
      fallBackImageUrlPath: require('~/assets/images/logo-with-claim.png')
    })
  },
  computed: {
    isArchivePage (): boolean {
      return this.rubricProperty === 'archive'
    },
    isSearchPage (): boolean {
      return this.rubricProperty === 'search'
    },
    query () {
      return this.$route.query.query
    }
  },
  watch: {
    query () {
      // Force component reload when search query changes
      this.page = undefined
      this.$nextTick(async () => {
        const page = await this.loadPage()
        if (page) {
          await this.initPageProperties(page)
          this.page = page
        }
      })
    }
  },
  async beforeMount () {
    // fixes https://hauptstadt.atlassian.net/browse/HA-121
    await this.$vuetify.goTo(0, { duration: 0 })

    const page = await this.loadPage()
    if (!page) {
      return
    }
    await this.initPageProperties(page)
    this.page = page

    window.dispatchEvent(new Event('scrollToSavedPosition'))
  },
  methods: {
    async loadPage (reduced: boolean = false): Promise<Page | false> {
      const pageSlug = this.$route.params.PageSlug
      return await new PageService({ vue: this }).getPage({ token: this.token, slug: pageSlug || this.token, reduced })
    },
    async initPageProperties (page: Page): Promise<void> {
      // load properties
      this.rubricProperty = page.properties?.findPropertyByKey('rubric')?.value
      // init properties
      await this.initRubricProperty(page)
    },

    /**
     * RUBRIC RELATED METHODS
     */
    async initRubricProperty (page: Page): Promise<void> {
      if (!this.rubricProperty) { return }
      // only load as many teasers as necessary
      this.teaserCount = page.countTeasers()
      if (!this.teaserCount) { return }
      // load article which will replace the dummy in the teasers
      const articles = await this.loadArticles({})
      if (this.isSearchPage && !articles) {
        page.showErrorMessage('Suche', 'Keine Resultate gefunden.')
      }
      if (!articles) { return }
      page?.replaceContainingArticles(articles)
    },
    async loadArticles ({ order }: {order?: SortOrder}): Promise<Articles | false> {
      // some checks at the beginning
      if (!this.rubricProperty) { return false }
      if (this.teaserCount === undefined) { return false }

      // in case of archive page, do not set any filter, instead load all articles no matter what tags are set
      let filter: ArticleFilter | undefined
      if (!this.isArchivePage && !this.isSearchPage) {
        filter = {
          tags: [this.rubricProperty]
        }
      }
      // in case of archive page, skip first page, since these articles are shown on the front page
      const skipPages = this.pagination.currentPage - (this.isArchivePage ? 0 : 1)
      const skip = skipPages * (this.teaserCount)

      // load phrases if this is a search page
      let articles: Articles | false
      if (this.isSearchPage) {
        const searchQuery: string = this.$route.query.query as string
        articles = await new PhraseService({ vue: this }).searchPhrase({
          searchQuery
        })
        // Sort articles by publication date, newest first
        if (articles) {
          articles.articles = articles.articles.sort((a, b) => {
            if (a.publishedAt?.isBefore(b.publishedAt)) { return 1 }
            if (a.publishedAt?.isAfter(b.publishedAt)) { return -1 }
            return 0
          })
        }
      } else {
        articles = await new ArticleService({ vue: this }).getArticles({
          take: this.teaserCount,
          skip,
          filter,
          reduced: true,
          sort: 'PUBLISHED_AT',
          order: order || 'DESCENDING'
        })
      }

      if (!articles) { return false }
      // update pagination
      let totalPages = Math.ceil(articles.totalCount / this.teaserCount)
      // archive page exception: subtract one page, because we set the second page as the first. thus, the last page has to be one bellow.
      if (this.isArchivePage && totalPages > 1) {
        totalPages -= 1
      }
      if (this.isSearchPage) {
        totalPages = 1
      }
      this.pagination!.update({ totalPages })
      return articles
    },
    async goToPage (page: number): Promise<void> {
      this.pagination.goToPage(page)
      const articles = await this.loadArticles({})
      if (articles) {
        await this.replaceArticles(articles)
      }
    },
    async replaceArticles (articles: Articles) {
      // re-load page, if it was last page (to avoid deleted teasers on the previous page)
      let page: Page | undefined | false = this.page
      if (this.teaserCount !== this.page?.countTeasers()) {
        // provoking the <wep-publication> component to re-render and cut-off title and image top blocks. Else we would double the top elements on this page
        this.page = undefined
        page = await this.loadPage()
      }
      // update page ui
      if (!page) { return }
      page?.replaceContainingArticles(articles)
      this.page = page
      this.scrollUp()
    },
    scrollUp () {
      const teaserGridBlockEl = document.getElementById('teaser-grid-block-view-0')
      if (!teaserGridBlockEl) { return }
      teaserGridBlockEl.scrollIntoView()
    }
  }
})
</script>
