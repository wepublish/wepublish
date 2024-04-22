<template class="element-identifier-paywall-content">
  <v-row
    v-if="show"
    id="minimizedPaywallSquare"
    class="primary align-center minimized-square-view no-gutters d-print-none"
  >
    <v-col class="col-12">
      <menu-button-entries
        :buttons="buttons"
        container-css="justify-center"
        column-css="py-0"
      />
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue from 'vue'
import Paywalls from '~/sdk/wep-cms/models/paywall/Paywalls'
import Navigations from '~/sdk/wep/models/navigation/Navigations'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import MenuButtonEntries from '~/components/navigation/header/menu/MenuButtonEntries.vue'

export default Vue.extend({
  name: 'MinimizedPaywallSquare',
  components: { MenuButtonEntries },
  data () {
    return {
      show: false
    }
  },
  computed: {
    MENU_NAVIGATION_KEYS (): string[] {
      return this.$store.getters['navigation/MENU_NAVIGATION_KEYS']
    },
    menuNavigations (): Navigations | undefined {
      return this.$store.getters['navigation/menuNavigations']
    },
    buttons (): Navigation | undefined {
      if (!this.menuNavigations) { return undefined }
      return this.menuNavigations.getNavigationByKey(this.MENU_NAVIGATION_KEYS[3])
    },
    // the paywall instance from the store which is initialized in default.vue
    paywalls (): undefined | Paywalls {
      return this.$store.getters['paywall/headerPaywalls'] as undefined | Paywalls
    }
  },
  mounted () {
    this.$nuxt.$on('showMinimizedPaywallSquare', () => {
      this.show = true
    })
    this.$nuxt.$on('hideMinimizedPaywallSquare', () => {
      this.show = false
    })
  },
  beforeDestroy () {
    this.$nuxt.$off('showMinimizedPaywallSquare')
    this.$nuxt.$off('hideMinimizedPaywallSquare')
  }
})
</script>
<style lang="scss">

.minimized-square-view {
  position: fixed;
  bottom: 10px;
  left: calc(50vw - 200px);
  width: 370px;
  background: black;
  height: 80px;
  z-index: 2;
  border-radius: 4px;
}
</style>
