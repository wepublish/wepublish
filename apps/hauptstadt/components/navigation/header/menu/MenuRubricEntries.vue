<template>
  <v-row
    v-if="rubrics"
    class="no-gutters"
  >
    <v-col class="col-12 col-md-6 col-lg-4 col-xl-3 pb-2 pb-lg-3 pb-xl-4 mb-2">
      <v-form @submit.prevent="submit">
        <v-text-field
          v-model="searchQuery"
          class="w-100"
          clearable
          hide-details
          prepend-inner-icon="fal fa-search"
          outlined
          :dense="mobile"
          placeholder="Artikelsuche"
        />
      </v-form>
    </v-col>
    <v-col
      v-for="(navigationLink, navigationLinkId) in rubrics.links.links"
      :key="navigationLinkId"
      class="col-12 tiempos-semibold cursor-pointer"
      @click="openLink(navigationLink)"
    >
      <div
        class="pb-2 pb-lg-3 pb-xl-4"
        :class="cssClass"
      >
        {{ navigationLink.label }}
      </div>
    </v-col>
  </v-row>
</template>
<script lang="ts">
import Vue, { PropType } from 'vue'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'

export default Vue.extend({
  name: 'MenuRubricEntries',
  props: {
    rubrics: {
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
  data () {
    return {
      searchQuery: ''
    }
  },
  computed: {
    mobile () {
      return this.$vuetify.breakpoint.mobile
    }
  },
  methods: {
    async openLink<T extends NavigationLink> (navigationLink: T): Promise<void> {
      const link: string | void = navigationLink.getFrontendLink()
      if (link) {
        await this.$router.push(link)
      }
      this.$store.commit('navigation/closeMenu')
    },
    async submit (): Promise<void> {
      // Hide the Android keyboard
      const activeElement = document.activeElement as HTMLElement
      if (activeElement) {
        activeElement.blur()
      }
      const preparedSearchQuery = this.searchQuery.replace(' ', ' & ')
      const link = `/p/search?query=${preparedSearchQuery}`
      this.searchQuery = ''
      await this.$router.push(link)
      this.$store.commit('navigation/closeMenu')
    }
  }
})
</script>
