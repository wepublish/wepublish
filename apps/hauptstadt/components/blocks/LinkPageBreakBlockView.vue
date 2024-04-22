<template>
  <v-row
    class="py-7 px-3"
  >
    <v-col
      class="col-12 px-5 px-sm-7 pb-1 pb-sm-3"
      :class="{
        'grey lighten-4': displayMode === 'Article',
        'border-left': displayMode === 'Page'
      }"
    >
      <v-row class="no-gutters">
        <!-- image -->
        <v-col
          v-if="linkPageBreakBlock.image"
          class="col-12 pt-2 pt-sm-4"
        >
          <v-img
            :src="linkPageBreakBlock.image.getUrl($vuetify)"
            eager
            :max-height="maxImageHeight()"
            max-width="100%"
            contain
          >
            <template #placeholder>
              <img-loading-slot />
            </template>
          </v-img>
        </v-col>

        <!-- title -->
        <v-col class="col-12 abc-bold title-22 pt-2 pt-sm-4 zoomable-text">
          {{ linkPageBreakBlock.text }}  <span v-if="peer"><a :href="peer.profile.websiteURL" target="_blank" style="color: black !important;">{{ peer.profile.name }}</a></span>
          <!-- peer subtitle. you have to pass a peer within the LinkPageBreakBlock instance -->
          <a
            v-if="peer"
            :href="peer.profile.callToActionURL"
            target="_blank"
            class="text-decoration-none"
          >
            <v-row
              class="no-gutters align-center mt-2"
            >
              <v-col class="col-9 col-sm-auto mr-sm-4 abc-light black--text">
                {{ new Slate({fontClassHeadings: ''}).toString(peer.profile.callToActionText) }}
              </v-col>
              <v-col class="col-auto">
                <v-img
                  :src="peer.profile.logo.xsUrl"
                  aspect-ratio="1"
                  width="44px"
                  class="border-radius-50"
                />
              </v-col>
            </v-row>
          </a>
        </v-col>

        <!-- text -->
        <v-col class="col-12 pt-2 abc-light font-size-15 zoomable-text">
          <span v-html="richText" />
        </v-col>

        <!-- link -->
        <v-col
          v-if="linkPageBreakBlock.linkURL"
          class="col-12 font-size-15 pb-4 zoomable-text"
        >
          <a
            :href="linkPageBreakBlock.linkURL"
            :target="linkPageBreakBlock.linkTarget"
          >
            {{ linkPageBreakBlock.linkText }}
          </a>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Slate from '~/sdk/wep/classes/Slate'
import LinkPageBreakBlock from '~/sdk/wep/models/block/LinkPageBreakBlock'
import ImgLoadingSlot from '~/sdk/wep/components/img/ImgLoadingSlot.vue'
import { WepPublicationTypeName } from '~/sdk/wep/interfacesAndTypes/WePublish'
import Peer from '~/sdk/wep/models/peer/Peer'

export default Vue.extend({
  name: 'LinkPageBreakBlockView',
  components: { ImgLoadingSlot },
  props: {
    linkPageBreakBlock: {
      type: Object as PropType<LinkPageBreakBlock>,
      required: true
    },
    displayMode: {
      type: String as PropType<WepPublicationTypeName>,
      required: false,
      default: 'Article'
    }
  },
  data () {
    return {
      Slate
    }
  },
  computed: {
    richText (): string | undefined {
      const richText = this.linkPageBreakBlock?.richText
      if (!richText) { return undefined }
      if (typeof richText === 'string') {
        return richText
      }
      return new Slate({ fontClassHeadings: 'abc-bold' }).toHtml(richText)
    },
    peer (): Peer | undefined {
      return this.linkPageBreakBlock.peer
    }
  },
  methods: {
    maxImageHeight (): string {
      const breakpoint = this.$vuetify.breakpoint

      if (breakpoint.lgAndUp) {
        return '500px'
      }
      if (breakpoint.mdAndUp) {
        return '450px'
      }
      return '390px'
    }
  }
})
</script>

<style lang="scss">
.border-left {
  border-left: 6px black solid;
}
</style>
