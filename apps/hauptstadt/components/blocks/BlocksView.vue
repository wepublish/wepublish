<template>
  <v-row class="no-gutters">
    <v-col class="col-12">
      <v-row
        v-for="(block, blockIndex) in blocks.blocks"
        :key="blockIndex"
        class="justify-center my-0"
      >
        <v-col
          class="col-auto w-100 px-sm-0"
          :class="{
            'max-width-520': isBoxed520(block),
            'max-width-580': isBoxed580(block),
            'max-width-680': isBoxed680(block),
            'max-width-840': isBoxed840(block),
            'position-relative paywall-content': showPaywall && block.__typename !== 'PaywallBlock'
          }"
        >
          <!-- rich text block -->
          <rich-text-block-view
            v-if="block instanceof RichTextBlock"
            :rich-text-block="block"
            :tiempos="tiempos"
          />
          <!-- teaser grid block -->
          <teaser-grid-block-view
            v-if="block instanceof TeaserGridBlock"
            :id="`teaser-grid-block-view-${blockIndex}`"
            :teaser-grid-block="block"
            :show-top-line="showTopLine(blockIndex)"
          />
          <!-- image block -->
          <image-block-view
            v-if="block instanceof ImageBlock"
            :image-block="block"
            :aspect-ratio="imageBlockAspectRatio"
          />
          <!-- title block -->
          <title-block-view
            v-if="block instanceof TitleBlock"
            :title-block="block"
            :tiempos="tiempos"
          />
          <!-- image gallery block -->
          <image-gallery-block-view
            v-if="block instanceof ImageGalleryBlock"
            :image-gallery-block="block"
          />
          <!-- listicle block todo: to be designed -->
          <!-- <listicle-block-view
            v-if="block instanceof ListicleBlock"
            :listicle-block="block"
          /> -->
          <!-- quote block -->
          <quote-block-view
            v-if="block instanceof QuoteBlock"
            :quote-block="block"
            :tiempos="tiempos"
          />
          <!-- embed block -->
          <embed-block-view
            v-if="block instanceof EmbedBlock"
            :embed-block="block"
          />
          <!-- twitter block -->
          <twitter-tweet-block-view
            v-if="block instanceof TwitterTweetBlock"
            :twitter-tweet-block="block"
          />
          <!-- instagram block -->
          <instagram-post-block-view
            v-if="block instanceof InstagramPostBlock"
            :instagram-post-block="block"
          />
          <!-- link page break block -->
          <link-page-break-block-view
            v-if="block instanceof LinkPageBreakBlock"
            :link-page-break-block="block"
            :display-mode="displayMode"
          />
          <!-- youtube video block -->
          <you-tube-video-block-view
            v-if="block instanceof YouTubeVideoBlock"
            :you-tube-video-block="block"
          />
          <!-- html block -->
          <html-block-view
            v-if="block instanceof HTMLBlock"
            :html-block="block"
          />
          <!-- crowdfunding block -->
          <crowdfunding-block-view
            v-if="block instanceof CrowdfundingBlock"
            :directus-crowdfunding-id="block.directusCrowdfundingId"
          />
          <!-- paywall block -->
          <paywall-content
            v-if="block instanceof PaywallBlock"
            :paywalls="block.paywalls"
            class="mt-3 mb-n4 mb-sm-n5 mb-md-n9 mb-lg-n15 mx-n4 mx-sm-0 mx-md-n2 mx-lg-0"
          />
          <!-- paywall overlay -->
          <div
            v-if="showPaywall && !peer && block.__typename !== 'PaywallBlock'"
            class="paywall-overlay"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import Blocks from '~/sdk/wep/models/block/Blocks'
import TeaserGridBlock from '~/sdk/wep/models/block/TeaserGridBlock'
import RichTextBlock from '~/sdk/wep/models/block/RichTextBlock'
import ImageBlock from '~/sdk/wep/models/block/ImageBlock'
import TitleBlock from '~/sdk/wep/models/block/TitleBlock'
import ImageGalleryBlock from '~/sdk/wep/models/block/ImageGalleryBlock'
import ListicleBlock from '~/sdk/wep/models/block/ListicleBlock'
import QuoteBlock from '~/sdk/wep/models/block/QuoteBlock'
import EmbedBlock from '~/sdk/wep/models/block/EmbedBlock'
import TwitterTweetBlock from '~/sdk/wep/models/block/TwitterTweetBlock'
import InstagramPostBlock from '~/sdk/wep/models/block/InstagramPostBlock'
import LinkPageBreakBlock from '~/sdk/wep/models/block/LinkPageBreakBlock'
import YouTubeVideoBlock from '~/sdk/wep/models/block/YouTubeVideoBlock'
import TeaserGridBlockView from '~/components/blocks/TeaserGridBlockView.vue'
import RichTextBlockView from '~/components/blocks/RichTextBlockView.vue'
import ImageBlockView from '~/components/blocks/ImageBlockView.vue'
import TitleBlockView from '~/components/blocks/TitleBlockView.vue'
import ImageGalleryBlockView from '~/components/blocks/ImageGalleryBlockView.vue'
import QuoteBlockView from '~/components/blocks/QuoteBlockView.vue'
import EmbedBlockView from '~/components/blocks/EmbedBlockView.vue'
import TwitterTweetBlockView from '~/components/blocks/TwitterTweetBlockView.vue'
import InstagramPostBlockView from '~/components/blocks/InstagramPostBlockView.vue'
import Block from '~/sdk/wep/models/block/Block'
import LinkPageBreakBlockView from '~/components/blocks/LinkPageBreakBlockView.vue'
import PaywallContent from '~/components/paywall/PaywallContent.vue'
import PaywallBlock from '~/sdk/wep/models/block/PaywallBlock'
import { WepPublicationTypeName } from '~/sdk/wep/interfacesAndTypes/WePublish'
import Peer from '~/sdk/wep/models/peer/Peer'
import YouTubeVideoBlockView from '~/components/blocks/YouTubeVideoBlockView.vue'
import CrowdfundingBlock from '~/sdk/wep/models/block/CrowdfundingBlock'
import CrowdfundingBlockView from '~/sdk/wep/components/blocks/CrowdfundingBlockView.vue'
import HtmlBlockView from '~/components/blocks/HtmlBlockView.vue'
import HTMLBlock from '~/sdk/wep/models/block/HTMLBlock'

export default Vue.extend({
  name: 'BlocksView',
  components: {
    HtmlBlockView,
    CrowdfundingBlockView,
    YouTubeVideoBlockView,
    PaywallContent,
    LinkPageBreakBlockView,
    InstagramPostBlockView,
    TwitterTweetBlockView,
    EmbedBlockView,
    QuoteBlockView,
    ImageGalleryBlockView,
    TitleBlockView,
    ImageBlockView,
    RichTextBlockView,
    TeaserGridBlockView
  },
  props: {
    blocks: {
      required: true,
      type: Object as PropType<Blocks>
    },
    // font family is tiempos
    tiempos: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    displayMode: {
      type: String as PropType<WepPublicationTypeName>,
      required: false,
      default: 'Article'
    },
    peer: {
      type: Object as PropType<Peer | undefined>,
      required: false,
      default: undefined
    },
    imageBlockAspectRatio: {
      type: Number as PropType<number | undefined>,
      required: false,
      default: undefined
    },
    showTeaserGridTopLine: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    showPaywall: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  data () {
    return {
      TeaserGridBlock,
      RichTextBlock,
      ImageBlock,
      TitleBlock,
      ImageGalleryBlock,
      ListicleBlock,
      QuoteBlock,
      EmbedBlock,
      TwitterTweetBlock,
      InstagramPostBlock,
      LinkPageBreakBlock,
      PaywallBlock,
      YouTubeVideoBlock,
      CrowdfundingBlock,
      HTMLBlock
    }
  },
  methods: {
    showTopLine (blockIndex: number): boolean {
      if (!this.showTeaserGridTopLine) { return false }
      if (blockIndex === 0) { return true }
      const previousBlockIndex = blockIndex - 1
      const previousBlock = this.blocks.blocks[previousBlockIndex]
      if (previousBlock instanceof TeaserGridBlock) { return false }
      return true
    },
    isBoxed520 (block: Block): boolean {
      if (block instanceof QuoteBlock) {
        return true
      }
      if (this.isBoxed580(block)) {
        return false
      }
      return false
    },
    isBoxed580 (block: Block): boolean {
      if (block instanceof LinkPageBreakBlock && this.displayMode === 'Article') {
        return true
      }
      if (this.isBoxed680(block)) {
        return false
      }
      return false
    },
    isBoxed680 (block: Block): boolean {
      if (block instanceof TeaserGridBlock || block instanceof PaywallBlock) {
        return false
      }
      if (this.isBoxed840(block)) {
        return false
      }
      return true
    },
    isBoxed840 (block: Block): boolean {
      if (block instanceof ImageBlock) {
        return true
      } else if (block instanceof ImageGalleryBlock) {
        return true
      }
      return false
    }
  }
})
</script>

<style lang="scss" scoped>
.paywall-content {
  max-height: 250px;
  overflow-y: hidden;
  overflow-x: hidden;
}
.paywall-overlay {
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100%;
  width: 100%;
  z-index: 1;
  background-image: linear-gradient(rgba( 255, 255, 255, 0 ) 0%, rgba( 255, 255, 255, 1 ) 100%);
}
</style>
