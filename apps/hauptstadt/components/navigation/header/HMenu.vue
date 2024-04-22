<template>
  <transition name="menu">
    <div
      v-if="menuIsOpen"
      class="menu-container white"
    >
      <v-row
        class="white justify-center mx-0"
      >
        <boxed-content>
          <v-row>
            <!-- tags -->
            <v-col class="col-12 py-6 px-6 pl-sm-12">
              <menu-rubric-entries
                :rubrics="rubrics"
                css-class="title-24 title-md-32 title-lg-40"
              />
            </v-col>

            <!-- other navigation -->
            <v-col class="col-12 py-8 py-lg-9 py-xl-10 px-6 pl-sm-12 primary">
              <menu-page-entries
                :pages="pages"
                :buttons="buttons"
                css-class="font-size-16 font-size-md-21 font-size-lg-23"
              />
            </v-col>

            <!-- logo icon -->
            <v-col class="col-12 text-right primary pr-6 pt-0">
              <img
                width="70px"
                src="~/assets/images/logo-icon-black.svg"
              >
            </v-col>
          </v-row>
        </boxed-content>
      </v-row>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from 'vue'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import Navigations from '~/sdk/wep/models/navigation/Navigations'
import BoxedContent from '~/components/layout/BoxedContent.vue'
import MenuPageEntries from '~/components/navigation/header/menu/MenuPageEntries.vue'
import MenuRubricEntries from '~/components/navigation/header/menu/MenuRubricEntries.vue'

export default Vue.extend({
  name: 'HMenu',
  components: { MenuRubricEntries, MenuPageEntries, BoxedContent },
  computed: {
    MENU_NAVIGATION_KEYS (): string[] {
      return this.$store.getters['navigation/MENU_NAVIGATION_KEYS']
    },
    menuIsOpen (): boolean {
      return this.$store.getters['navigation/menuOpen']
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
    buttons (): Navigation | undefined {
      if (!this.menuNavigations) { return undefined }
      return this.menuNavigations.getNavigationByKey(this.MENU_NAVIGATION_KEYS[3])
    }
  }
})
</script>

<style lang="scss">
@import '~vuetify/src/styles/settings/variables';
@import 'assets/styles/variables';

.menu-container {
  height: calc(100vh - #{$header-height});
  width: 100%;
  position: fixed;
  top: $header-height;
  left: 0;
  white-space: nowrap;
  overflow-x: scroll;
  overflow-y: scroll;
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.menu-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .menu-container {
    top: calc(#{$header-height-sm-and-up} - 1px);
    height: calc(100vh - #{$header-height-sm-and-up} + 1px);
  }
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .menu-container {
    top: calc(#{$header-height-md-and-up} - 1px);
    height: calc(100vh - #{$header-height-md-and-up} + 1px);
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .menu-container {
    top: calc(#{$header-height-lg-and-up} - 1px);
    height: calc(100vh - #{$header-height-lg-and-up} + 1px);
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .menu-container {
    top: calc(#{$header-height-xl-only} - 1px);
    height: calc(100vh - #{$header-height-xl-only} + 1px);
  }
}

/*
  MENU CONTENT ANIMATION
 */
@keyframes menu-container-animation {
  from {
    width: 0px;
  }
  to {
    width: 100%;
  }
}

.menu-enter-active {
  animation: menu-container-animation 200ms;
}
.menu-leave-active {
  animation: menu-container-animation 200ms reverse;
}
</style>
