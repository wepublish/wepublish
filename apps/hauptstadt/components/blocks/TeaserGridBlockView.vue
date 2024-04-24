<template>
  <!-- my-0 fixes https://hauptstadt.atlassian.net/browse/HA-51 -->
  <v-row
    v-if="teasers"
    :class="{
      'px-lg-6 px-xl-11': isMultiBlock
    }"
  >
    <!-- primary line -->
    <v-col
      v-if="showTopLine"
      class="col-12 pb-6 pt-0 pb-sm-7 pt-sm-1 pb-md-13 pt-md-5 pb-xl-19 pt-xl-11"
    >
      <div class="primary-line-1" />
    </v-col>

    <!-- iterate teasers -->
    <v-col
      v-for="(teaser, teaserIndex) in teasers"
      :key="teaserIndex"
      class="mb-5 mb-sm-8 mb-md-12 mb-xl-19 py-0 px-md-6 px-xl-9"
      :class="[isMultiBlock ? 'col-12 col-sm-4 col-md-4' : 'col-12']"
    >
      <v-row
        class="no-gutters fill-height"
      >
        <v-col
          class="col-12"
          :class="{
            'px-lg-6 px-xl-11': isSingleBlock
          }"
        >
          <nuxt-link
            class="reset-a-style"
            :to="getLink(teaser)"
          >
            <v-row
              class="no-gutters cursor-pointer"
            >
              <!-- image -->
              <v-col
                v-if="showImage(teaser)"
                class="align-self-center position-relative"
                :class="{
                  'col-12 pb-3 pb-sm-0': isSingleBlock,
                  'order-sm-1': isSingleBlock && isLightStyle(teaser),
                  'pb-sm-0': isSingleBlock && !isLightStyle(teaser),
                  'col-sm-7 col-xl-7': isSingleBlock && !isTextStyle(teaser),
                  'pb-xl-9': isMultiBlock,
                  'col-4 col-sm-12 pb-0 pb-sm-3': isMultiBlock && isLightStyle(teaser),
                  'col-12 pb-md-4 pb-3': isMultiBlock && !isLightStyle(teaser)
                }"
              >
                <!-- main image -->
                <v-img
                  :src="teaser.image.getUrl($vuetify)"
                  :aspect-ratio="3/2"
                  eager
                >
                  <template #placeholder>
                    <img-loading-slot />
                  </template>
                </v-img>
                <!-- peering image overlay -->
                <PeeringImgOverlay
                  v-if="teaser.peer && teaser.peer.profile"
                  :peer="teaser.peer"
                  :max-width="$vuetify.breakpoint.xsOnly && isMultiBlock && isLightStyle(teaser) ? '23%' : '13%'"
                  :class="{
                    'mb-3 mb-sm-0': isSingleBlock,
                    'mb-3 mb-md-4 mb-xl-9': isMultiBlock && !isLightStyle(teaser),
                    'mb-sm-3 mb-xl-9': isMultiBlock && isLightStyle(teaser)
                  }"
                />
              </v-col>

              <!-- title, lead, authors -->
              <v-col
                class="px-1"
                :class="{
                  'col-12': isSingleBlock,
                  'order-sm-0': isSingleBlock && isLightStyle(teaser),
                  'col-sm-5 col-xl-5': isSingleBlock && !isTextStyle(teaser),
                  'col-12': isMultiBlock && !isLightStyle(teaser),
                  'col-8 col-sm-12 pl-3 pl-sm-1 mt-n1 mt-sm-0': isMultiBlock && isLightStyle(teaser)
                }"
              >
                <v-row
                  class="no-gutters fill-height"
                  :class="{
                    'align-sm-center': isSingleBlock
                  }"
                >
                  <v-col
                    class="col-12"
                    :class="{
                      'pl-sm-4 pl-md-9 pl-xl-14': isSingleBlock && isDefaultStyle(teaser),
                      'pr-3 pr-sm-4 pr-md-9 pr-xl-14': isSingleBlock && isLightStyle(teaser)
                    }"
                  >
                    <v-row class="no-gutters">
                      <!-- pre-title -->
                      <v-col
                        v-if="teaser.preTitle && !isPeer(teaser)"
                        class="col-12 abc-semibold font-size-16 zoomable-text"
                        :class="{
                          'py-2 pt-sm-0 pb-md-3 pb-xl-6 font-size-md-19 font-size-lg-20 font-size-xl-27': isSingleBlock,
                          'pb-2 pb-xl-4 font-size-sm-15 font-size-md-16 font-size-lg-17 font-size-xl-24': isMultiBlock && isTextStyle(teaser),
                          'pb-2 pb-xl-4 pt-1 font-size-sm-15 font-size-md-16 font-size-lg-17 font-size-xl-24': isMultiBlock && !isTextStyle(teaser),
                        }"
                      >
                        <span class="px-1 beige">
                          {{ teaser.preTitle }}
                        </span>
                      </v-col>

                      <!-- title -->
                      <v-col
                        class="col-12 pb-2 tiempos-semibold tiempos-bold-md"
                        :class="{
                          'pb-sm-4 pb-md-6 pb-xl-12': isSingleBlock,
                          'pb-lg-4 pb-xl-9': isMultiBlock,
                        }"
                      >
                        <h1
                          class="zoomable-text"
                          :class="{
                            'title-24 title-sm-24 title-md-32 title-lg-40 title-xl-58': isSingleBlock,
                            'title-16': isMultiBlock && isLightStyle(teaser),
                            'title-24': isMultiBlock && !isLightStyle(teaser),
                            'title-sm-20 title-md-22 title-lg-24 title-xl-39': isMultiBlock
                          }"
                        >
                          {{ teaser.title }}
                        </h1>
                      </v-col>

                      <!-- lead -->
                      <v-col
                        v-if="showLead(teaser)"
                        class="col-12 pb-3"
                        :class="{
                          'pb-sm-4 pb-md-6 pb-xl-12': isSingleBlock,
                          'pb-lg-4 pb-xl-9': isMultiBlock,
                        }"
                      >
                        <h6
                          class="lead-16 tiempos tiempos-medium-lg zoomable-text"
                          :class="{
                            'lead-md-21 lead-lg-23 lead-xl-36': isSingleBlock,
                            'lead-sm-14 lead-md-16 lead-lg-17 lead-xl-26': isMultiBlock,
                            'font-italic': isItalic(teaser)
                          }"
                        >
                          {{ teaser.lead }}
                        </h6>
                      </v-col>
                      <!-- authors -->
                      <v-col
                        v-if="teaser.wepPublication && teaser.wepPublication.authors"
                        class="col-12 abc"
                      >
                        <authors-line
                          :authors="teaser.wepPublication.authors"
                          :date="teaser.wepPublication.publishedAt"
                          :peer="teaser.peer"
                          :html-class="
                            `col-12
                          ${isMultiBlock && isLightStyle(teaser) ? 'caption-10' : 'caption-12'}
                          ${isMultiBlock ? 'caption-sm-10 caption-lg-13' : ''}
                          ${isSingleBlock && !isTextStyle(teaser) ? 'caption-md-14 caption-lg-15 caption-xl-20' : 'caption-xl-18'}
                          ${isSingleBlock && isTextStyle(teaser) ? 'caption-md-17 caption-xl-22' : ''}`
                          "
                        />
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </nuxt-link>
        </v-col>
        <!-- bottom line -->
        <v-col class="col-12 pt-5 pt-sm-8 pt-md-12 pt-xl-19 order-sm-2 align-self-end">
          <div class="primary-line-1" />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import TeaserGridBlock from '~/sdk/wep/models/block/TeaserGridBlock'
import { TeaserTypes } from '~/sdk/wep/models/teaser/Teasers'
import ArticleTeaser from '~/sdk/wep/models/teaser/ArticleTeaser'
import Teaser from '~/sdk/wep/models/teaser/Teaser'
import AuthorsLine from '~/components/author/AuthorsLine.vue'
import ImgLoadingSlot from '~/sdk/wep/components/img/ImgLoadingSlot.vue'
import PeerArticleTeaser from '~/sdk/wep/models/teaser/PeerArticleTeaser'
import PeeringImgOverlay from '~/components/blocks/PeeringImgOverlay.vue'

export default Vue.extend({
  name: 'TeaserGridBlockView',
  components: { PeeringImgOverlay, ImgLoadingSlot, AuthorsLine },
  props: {
    teaserGridBlock: {
      type: Object as PropType<TeaserGridBlock>,
      required: true
    },
    showTopLine: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  data () {
    return {
      TeaserClass: Teaser,
      ArticleTeaser
    }
  },
  computed: {
    teasers (): TeaserTypes[] | undefined {
      return this.teaserGridBlock?.teasers?.teasers
    },
    isMultiBlock (): boolean {
      return !!this.teasers && this.teasers.length > 1
    },
    isSingleBlock (): boolean {
      return !this.isMultiBlock
    }
  },
  methods: {
    showLead (teaser: TeaserTypes): boolean {
      if (!teaser.lead) { return false }
      if (this.isMultiBlock && this.$vuetify.breakpoint.xsOnly && teaser.style === Teaser.styles.default) { return false }
      if (this.isMultiBlock && teaser.style === Teaser.styles.light) { return false }
      return true
    },
    showImage (teaser: TeaserTypes): boolean {
      if (!teaser.image) { return false }
      if (teaser.style === Teaser.styles.text) { return false }
      return true
    },
    isTextStyle <T extends Teaser> (teaser: T): boolean {
      return teaser.style === this.TeaserClass.styles.text
    },
    isLightStyle <T extends Teaser> (teaser: T): boolean {
      return teaser.style === this.TeaserClass.styles.light
    },
    isDefaultStyle <T extends Teaser> (teaser: T): boolean {
      return teaser.style === this.TeaserClass.styles.default
    },
    isItalic <T extends Teaser> (teaser: T): boolean {
      return !!teaser.wepPublication?.properties?.findPropertyByKeyAndValue('type', 'opinion')
    },
    getLink (teaser: Teaser): string | void {
      const peerSlug = this.$route.params.peerSlug
      if (peerSlug || teaser.__typename === 'PeerArticleTeaser') {
        const peerArticleTeaser = teaser as unknown as PeerArticleTeaser
        return `/peer/${peerArticleTeaser?.peer?.slug || peerSlug}/${teaser?.wepPublication?.id}`
      } else if (teaser.__typename === 'ArticleTeaser') {
        // article id is for paywall purposes. see WepPublication.vue
        const baseUrl = `/a/${teaser?.wepPublication?.slug}`
        const hasAccess = this.$store.getters['auth/hasAccess']
        return hasAccess ? baseUrl : `${baseUrl}?articleId=${teaser.wepPublication?.id}`
      } else if (teaser.__typename === 'PageTeaser') {
        return `/p/${teaser?.wepPublication?.slug}`
      }
    },
    isPeer (teaser: Teaser): boolean {
      return teaser instanceof PeerArticleTeaser
    }
  }
})
</script>
