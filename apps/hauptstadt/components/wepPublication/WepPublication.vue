<template>
  <v-row
    v-if="publication"
    class="justify-center px-sm-10 px-md-8 px-lg-16 pb-10"
  >
    <!-- max 840px -->
    <!-- image -->
    <v-col
      v-if="imageBlock && imageBlock.image"
      class="col-12 pb-0 px-0"
    >
      <v-row class="justify-center">
        <v-col
          class="col-12 pt-0 px-sm-0 max-width-840"
        >
          <h-image
            :image="imageBlock.image"
            :caption="imageBlock.caption"
            :aspect-ratio="3/2"
            is-main-image
            :peer="peer"
          />
        </v-col>
      </v-row>
    </v-col>

    <!-- max 680px -->
    <v-col
      class="col-12 px-4 px-sm-0 max-width-680"
      :class="[{
        'pt-8': hideAuthorsLine
      }]"
    >
      <v-row>
        <!-- title -->
        <v-col
          v-if="titleBlock"
          class="col-12"
        >
          <title-block-view
            :title-block="titleBlock"
            :pre-title="peer ? undefined : preTitle"
            :tiempos="tiempos"
            :lead-css-class="isItalic ? 'font-italic' : ''"
          />
        </v-col>

        <!-- peer block -->
        <v-col
          v-if="peeringBlock"
          class="col-12 pt-0 pb-7"
        >
          <link-page-break-block-view
            :link-page-break-block="peeringBlock"
            :display-mode="displayMode"
          />
        </v-col>

        <!-- authors and date -->
        <v-col
          v-if="!hideAuthorsLine"
          class="col-12 py-0"
        >
          <authors-line
            :date="publication.publishedAt"
            :authors="publication.authors"
            :peer="peer"
            html-class="caption-14 caption-sm-16"
          />
        </v-col>

        <!-- line -->
        <v-col
          v-if="!hideAuthorsLine"
          class="col-12 pt-1 pb-0"
        >
          <div class="primary-line-1" />
        </v-col>

        <!-- comments -->
        <v-col
          v-if="showComments"
          class="col-auto pt-2 pb-0 pr-0 caption-14 caption-sm-16 d-print-none zoomable-text"
        >
          <span class="fal fa-comment" />
          <nuxt-link
            class="black--text"
            to="#publicationComments"
          >
            <span v-if="commentsCount <= 0">Keine Beiträge</span>
            <span v-else-if="commentsCount === 1">1 Beitrag</span>
            <span v-else>{{ commentsCount }}  Beiträge</span>
          </nuxt-link>
        </v-col>

        <!-- share -->
        <v-col
          v-if="!hideAuthorsLine"
          class="col-auto pt-2 pb-0 pr-0 caption-14 caption-sm-16 cursor-pointer d-print-none zoomable-text"
          @click="copyLink()"
        >
          <span class="fal fa-share" /> <span class="text-decoration-underline">Teilen</span>
        </v-col>

        <!-- print -->
        <v-col
          v-if="!hideAuthorsLine"
          class="col-auto pt-2 pb-0 pr-0 caption-14 caption-sm-16 cursor-pointer d-print-none zoomable-text"
          @click="print()"
        >
          <span class="fal fa-print" /> <span class="text-decoration-underline">Drucken</span>
        </v-col>

        <!-- dynamic font size -->
        <v-col
          v-if="!hideAuthorsLine"
          class="pt-2 pb-0 pr-0 caption-14 caption-sm-16 cursor-pointer d-print-none zoomable-text"
        >
          <TextZoom />
        </v-col>
      </v-row>
    </v-col>

    <!-- content -->
    <v-col
      v-if="publication.blocks"
      class="col-12 px-4 px-sm-0 abc-light"
      :class="{
        'pt-4': !hideAuthorsLine,
        'pt-0': hideAuthorsLine
      }"
    >
      <blocks-view
        :blocks="publication.blocks"
        :tiempos="tiempos"
        :display-mode="displayMode"
        :show-teaser-grid-top-line="!!titleBlock.title || !!imageBlock.image"
        :show-paywall="showPaywall"
        :peer="peer"
      />
    </v-col>

    <!-- eventually show pagination -->
    <v-col
      v-if="pagination && pagination.totalPages > 1"
      class="col-12 pt-md-0"
    >
      <wep-pagination
        class="abc-light"
        :pagination="pagination"
        @goToPage="(page) => {$emit('goToPage', page)}"
      />
    </v-col>

    <!-- eventually content by property types -->
    <v-col class="col-12">
      <page-properties-content
        :publication="publication"
      />
    </v-col>

    <!-- eventually show comments -->
    <v-col
      v-if="showComments"
      class="max-width-680 pt-14 d-print-none"
    >
      <user-interaction-offline
        v-if="$config.USER_INTERACTION_OFFLINE === true"
        offline-function="Kommentar"
      />
      <publication-comments
        v-else
        :comment-depth="0"
        :comments="publication.comments"
        :publication-id="publication.id"
        publication-type="Article"
        class="max-width-580"
      />
    </v-col>

    <!-- we.publish analytics -->
    <div
      v-if="peer"
      id="peer-element"
      :data-peer-name="peer.name"
      :data-peer-article-id="publication.id"
      data-publisher-name="Hauptstadt"
    />
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import clipboardCopy from 'clipboard-copy'
import { Directus } from '@directus/sdk'
import { initWepublishAnalytics, trackPage } from '@wepublish/analytics'
import Article from '~/sdk/wep/models/wepPublication/article/Article'
import Page from '~/sdk/wep/models/wepPublication/page/Page'
import BlocksView from '~/components/blocks/BlocksView.vue'
import AuthorsLine from '~/components/author/AuthorsLine.vue'
import TitleBlock from '~/sdk/wep/models/block/TitleBlock'
import TitleBlockView from '~/components/blocks/TitleBlockView.vue'
import ImageBlock from '~/sdk/wep/models/block/ImageBlock'
import Pagination from '~/sdk/wep/models/wepPublication/Pagination'
import WepPagination from '~/sdk/wep/components/pagination/WepPagination.vue'
import Peer from '~/sdk/wep/models/peer/Peer'
import PaywallBlock from '~/sdk/wep/models/block/PaywallBlock'
import TeaserGridBlock from '~/sdk/wep/models/block/TeaserGridBlock'
import Paywalls from '~/sdk/wep-cms/models/paywall/Paywalls'
import PublicationComments from '~/components/comment/PublicationComments.vue'
import LinkPageBreakBlock from '~/sdk/wep/models/block/LinkPageBreakBlock'
import PeeringInfoBox, { PeeringInfoBoxType } from '~/sdk/wep-cms/models/peering/PeeringInfoBox'
import { WepPublicationTypeName } from '~/sdk/wep/interfacesAndTypes/WePublish'
import LinkPageBreakBlockView from '~/components/blocks/LinkPageBreakBlockView.vue'
import HImage from '~/components/img/HImage.vue'
import PagePropertiesContent from '~/components/wepPublication/PagePropertiesContent.vue'
import CrowdfundingBlock from '~/sdk/wep/models/block/CrowdfundingBlock'
import UserInteractionOffline from '~/sdk/wep/components/helpers/UserInteractionOffline.vue'
import TextZoom from '~/components/helpers/TextZoom.vue'

export default Vue.extend({
  name: 'WepPublication',
  components: {
    TextZoom,
    UserInteractionOffline,
    PagePropertiesContent,
    HImage,
    LinkPageBreakBlockView,
    PublicationComments,
    WepPagination,
    TitleBlockView,
    AuthorsLine,
    BlocksView
  },
  props: {
    publication: {
      type: Object as PropType<Article | Page>,
      required: true
    },
    tiempos: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    peer: {
      type: Object as PropType<Peer | undefined>,
      required: false,
      default: undefined
    },
    pagination: {
      type: Object as PropType<Pagination | undefined>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      titleBlock: false as false | TitleBlock,
      imageBlock: false as false | ImageBlock,
      Article,
      Page,
      // paywall
      showPaywall: false as boolean,
      peeringBlock: undefined as undefined | LinkPageBreakBlock
    }
  },
  computed: {
    hideAuthorsLine (): boolean {
      return this.publication instanceof Page || !this.publication.authors
    },
    displayMode (): WepPublicationTypeName {
      return this.publication instanceof Article ? 'Article' : 'Page'
    },
    isItalic (): boolean {
      return !!this.publication.properties?.findPropertyByKeyAndValue('type', 'opinion')
    },
    paywalls (): undefined | Paywalls {
      // user cannot read the articles content
      let paywalls
      if (this.showPaywall) {
        paywalls = this.$store.getters['paywall/articlePaywalls']
      } else {
        paywalls = this.$store.getters['paywall/articleEndPaywalls']
      }
      return paywalls
    },
    commentsCount (): number | undefined {
      if (this.publication instanceof Article) {
        return this.publication.comments?.countComments() || 0
      }
      return undefined
    },
    showComments (): boolean {
      return !!(this.publication instanceof Article && !this.showPaywall && this.publication.comments && !this.peer)
    },
    preTitle (): string | undefined {
      if (this.publication instanceof Article) {
        return this.publication?.preTitle
      }
      return undefined
    }
  },
  watch: {
    // add paywall content as soon as loaded
    paywalls: {
      handler (newPaywalls) {
        if (newPaywalls !== undefined) {
          this.addPaywallBlock(newPaywalls)
        }
      },
      deep: true,
      immediate: true
    },
    // enlarge font-size
    publication: {
      handler () {
        // only zoom text if it's an article or peer article.
        if (!(this.publication instanceof Article)) {
          return
        }
        // apply text zoom
        this.$nextTick(async () => {
          await this.$store.dispatch('textZoom/updateZoom', { vue: this })
        })
      },
      deep: false,
      immediate: true
    }
  },
  async mounted () {
    // eventually apply to paywall and remove blocks
    this.removeBlocksForPaywall()
    // remove image and title block
    this.removeHeaderBlocks()
    // start the analytics for the WePublish network
    this.initPeerAnalytics()
    // add a crowdfunding block
    this.addCrowdfundingBlock()
    // add peer block at the end
    await this.addPeeringBlock()
  },
  methods: {
    initPeerAnalytics () {
      // only send data in production environment
      if (this.$config.ENVIRONMENT !== 'production') {
        return
      }
      // analytics for peer articles only
      if (!this.peer) {
        return
      }
      initWepublishAnalytics({ appName: 'hauptstadt' })
      trackPage()
    },
    removeHeaderBlocks () {
      this.titleBlock = this.getTitleBlock()
      this.imageBlock = this.getImageBlock()
    },
    paywallRulesGiven (): boolean {
      if (this.peer) {
        return false
      }
      // only apply paywall for articles
      if (this.displayMode !== 'Article') {
        return false
      }
      // only apply paywall if user doesn't have access
      return !this.$store.getters['auth/hasAccess']
    },
    // remove blocks and add fadeout overlay
    removeBlocksForPaywall (): void {
      if (!this.paywallRulesGiven()) {
        return
      }
      const blocks = this.publication.blocks
      // workaround for https://github.com/vuejs/vue-router/issues/2157
      let startPath = (this.$router as any).history._startLocation as string
      // workaround for https://hauptstadt.atlassian.net/browse/HA-82
      startPath = startPath.replace('/article/', '/a/')
      const currentPath = this.$route.fullPath

      // in case a shorten link and redirect happens, set the startPath to the current path
      if (startPath.startsWith('/l/')) {
        startPath = currentPath
      }
      const paywallKey = this.$route.query.articleId
      if (startPath !== currentPath || paywallKey) {
        // apply paywall
        blocks?.removeBlocks(3)
        this.showPaywall = true
      } else {
        this.showPaywall = false
      }
    },
    addPaywallBlock (paywalls: Paywalls): void {
      if (!this.paywallRulesGiven()) {
        return
      }
      // rotate paywall content
      this.$store.commit('paywall/getNext', paywalls)
      // create paywall block to integrate into blocks view
      const paywallBlock = new PaywallBlock({ __typename: 'PaywallBlock', paywalls })
      const blocks = this.publication.blocks
      const lastBlock = blocks?.getLastBlock()
      // add paywall block between last teaser grid and content
      if (lastBlock instanceof TeaserGridBlock && blocks) {
        const blocksLength = blocks?.blocks.length
        blocks?.blocks.splice(blocksLength - 1, 0, paywallBlock)
      } else {
        blocks?.blocks.push(paywallBlock)
      }
    },
    addCrowdfundingBlock (): void {
      const propertyPosition = this.publication?.properties?.findPropertyByKey('crowdfunding-block-position')?.value
      if (propertyPosition === undefined) {
        return
      }
      const directusId = this.publication?.properties?.findPropertyByKey('crowdfunding-directus-id')?.value
      const crowdfundingBlock = new CrowdfundingBlock({
        __typename: 'CrowdfundingBlock',
        directusCrowdfundingId: directusId ? parseInt(directusId) : undefined
      })
      const blocks = this.publication.blocks
      let position = parseInt(propertyPosition)
      position = position - 3 < 0 ? 0 : position - 3
      blocks?.blocks.splice(position, 0, crowdfundingBlock)
    },
    async addPeeringBlock () {
      // checking if peer is available
      const peerProfile = this.peer?.profile
      if (!peerProfile) {
        return
      }
      // checking if blocks are available
      const blocks = this.publication.blocks?.blocks
      if (!blocks) {
        return
      }
      // getting the data from directus
      const peeringInfoBox = await this.getPeeringInfoBoxFromDirectus()
      if (!peeringInfoBox) {
        return
      }
      // creating new block
      this.peeringBlock = new LinkPageBreakBlock({
        __typename: 'LinkPageBreakBlock',
        text: peeringInfoBox.title,
        peer: this.peer,
        richText: peeringInfoBox.text
      })
      // add the peering block at the bottom of the content
      blocks.push(this.peeringBlock)
    },
    async getPeeringInfoBoxFromDirectus (): Promise<undefined | PeeringInfoBox> {
      try {
        const directus = new Directus<PeeringInfoBoxType>(this.$config.WEP_CMS_URL)
        const response = await directus.items('Peering_Info_Box').readByQuery()
        if (response?.data) {
          return new PeeringInfoBox(response.data as unknown as PeeringInfoBox)
        }
        return undefined
      } catch (e) {
        this.$sentry.captureException(e)
        return undefined
      }
    },

    getTitleBlock () {
      if (!this.publication) {
        return false
      }
      // If the blocks have any title block at the top, it should override the publication's title and lead because of Bajour's data structure.
      const titleBlockDefinition = 'TitleBlock'
      const titleBlock: TitleBlock | false = this.publication.cutTopBlockType(titleBlockDefinition)
      if (titleBlock) {
        return titleBlock
      }
      const lead = this.publication instanceof Article ? this.publication.lead : undefined
      const title = this.publication.title
      return new TitleBlock({ __typename: titleBlockDefinition, title, lead })
    },
    getImageBlock () {
      if (!this.publication) {
        return false
      }
      const imageBlockDefinition = 'ImageBlock'
      const imageBlock: ImageBlock | false = this.publication.cutTopBlockType(imageBlockDefinition)
      if (imageBlock) {
        return imageBlock
      }
      return new ImageBlock({ __typename: imageBlockDefinition, image: this.publication.image })
    },
    copyLink (): void {
      clipboardCopy(window.location.href)
      this.$nuxt.$emit('alert', { title: 'Link in die Zwischenablage kopiert.', type: 'primary' })
    },
    print (): void {
      // HauptstadtAndrod is injected into the WebView of the mobile app and
      // can be used to call native methods in the app.
      // @ts-ignore
      if (typeof HauptstadtAndroid !== 'undefined' && HauptstadtAndroid !== null) {
        // @ts-ignore
        HauptstadtAndroid.sendMessage('print')
        return
      }
      window.print()
    }
  }
})
</script>
