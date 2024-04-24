<template>
  <v-row
    v-if="pages"
    class="no-gutters"
  >
    <!-- login button -->
    <v-col
      v-if="buttons"
      class="col-12 pb-6"
    >
      <menu-button-entries
        :buttons="buttons"
        show-invoice-hint-claim
      />
    </v-col>

    <!-- iterate menu pages -->
    <v-col
      v-for="(pageNavigation, pageNavigationIndex) in pages.links.links"
      :key="pageNavigationIndex"
      class="col-12 pb-2 cursor-pointer"
      :class="cssClass"
      @click="openLink(pageNavigation)"
    >
      {{ pageNavigation.label }}
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import MenuButtonEntries from '~/components/navigation/header/menu/MenuButtonEntries.vue'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'

export default Vue.extend({
  name: 'MenuPageEntries',
  components: { MenuButtonEntries },
  props: {
    pages: {
      type: Object as PropType<Navigation | undefined>,
      required: false,
      default: undefined
    },
    buttons: {
      type: Object as PropType<Navigation | undefined>,
      required: false,
      default: undefined
    },
    cssClass: {
      type: String as PropType<string>,
      required: false,
      default: ''
    }
  },
  methods: {
    async openLink<T extends NavigationLink> (navigationLink: T): Promise<void> {
      const link: string | void = navigationLink.getFrontendLink()
      if (link) {
        await this.$router.push(link)
      }
      this.$store.commit('navigation/closeMenu')
    }
  }
})
</script>
