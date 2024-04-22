<template>
  <v-footer
    dark
    class="pt-12 pb-6 pb-lg-8 pb-xl-12 pt-xl-16 d-print-none"
  >
    <v-row class="no-gutters justify-center">
      <boxed-content>
        <v-row class="no-gutters w-100 px-sm-3 pl-lg-18 pr-lg-18 pl-xl-25 pr-xl-25">
          <!-- rubrics -->
          <v-col class="col-12 col-md-6">
            <rubric-entries
              :rubrics="rubrics"
              css-class="title-24 title-md-32 title-lg-40"
            />
          </v-col>

          <!-- pages -->
          <v-col class="col-12 col-md-3 pt-12 pt-md-0">
            <menu-page-entries
              class="ml-md-n1"
              :pages="pages"
              css-class="font-size-16 font-size-md-21 font-size-lg-23"
            />
          </v-col>

          <!-- social media -->
          <v-col class="col-12 offset-md-6 col-md-6 pt-12 pt-md-0">
            <v-row
              v-if="socialMedias"
              class="no-gutters fill-height align-center justify-md-end ml-md-n1"
            >
              <v-col
                v-for="(socialMedia, socialMediaIndex) in socialMedias.links.links"
                :key="socialMediaIndex"
                class="col-auto"
              >
                <a :href="socialMedia.url" target="_blank" class="white--text">
                  <span
                    class="fab fa-facebook pr-6 pr-xl-12 title-24 title-md-32 title-lg-40"
                    :class="`fa-${socialMedia.label}`"
                  />
                </a>
              </v-col>

              <v-spacer />

              <v-col class="col-auto text-right">
                <img
                  v-if="$vuetify.breakpoint.smAndDown"
                  width="55px"
                  src="~/assets/images/logo-icon-white.svg"
                >

                <div
                  v-if="$vuetify.breakpoint.mdAndUp"
                  class="pr-6 pb-1 pb-lg-3 pb-xl-7 pr-xl-8"
                  style="position: absolute; bottom: 0px; right: 0px;"
                >
                  <img
                    :width="`${logoIconSize}px`"
                    src="~/assets/images/logo-icon-white.svg"
                  >
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </boxed-content>
    </v-row>
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue'
import Navigations from '~/sdk/wep/models/navigation/Navigations'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import RubricEntries from '~/components/navigation/header/menu/MenuRubricEntries.vue'
import MenuPageEntries from '~/components/navigation/header/menu/MenuPageEntries.vue'
import BoxedContent from '~/components/layout/BoxedContent.vue'

export default Vue.extend({
  name: 'HFooter',
  components: { BoxedContent, MenuPageEntries, RubricEntries },
  computed: {
    MENU_NAVIGATION_KEYS (): string[] {
      return this.$store.getters['navigation/MENU_NAVIGATION_KEYS']
    },
    menuNavigations (): Navigations | null {
      return this.$store.getters['navigation/menuNavigations']
    },
    rubrics (): Navigation | undefined {
      if (!this.menuNavigations) { return undefined }
      return this.menuNavigations.getNavigationByKey(this.MENU_NAVIGATION_KEYS[0])
    },
    pages (): Navigation | undefined {
      if (!this.menuNavigations) { return undefined }
      return this.menuNavigations.getNavigationByKey(this.MENU_NAVIGATION_KEYS[1])
    },
    socialMedias (): Navigation | undefined {
      if (!this.menuNavigations) { return undefined }
      return this.menuNavigations.getNavigationByKey(this.MENU_NAVIGATION_KEYS[2])
    },
    logoIconSize (): number {
      const breakpoint = this.$vuetify.breakpoint
      if (breakpoint.xlOnly) {
        return 80
      }
      if (breakpoint.lgAndUp) {
        return 80
      }
      if (breakpoint.mdAndUp) {
        return 64
      }
      return 64
    }
  }
})
</script>
