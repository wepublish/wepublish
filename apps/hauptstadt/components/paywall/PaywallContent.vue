<template>
  <v-row
    v-if="currentPaywall"
    class="primary element-identifier-paywall-content d-print-none"
  >
    <!-- full view -->
    <v-col
      v-if="!paywalls.minimized"
      class="col-12"
    >
      <!-- closing button md-and-up -->
      <div
        v-if="paywalls.isResizable()"
        class="cursor-pointer hidden-sm-and-down pt-0 position-relative"
        @click="$store.commit('paywall/minimize', paywalls)"
      >
        <div
          style="position: absolute; top: 0px; right: 0px;"
          class="mr-3 mt-2"
        >
          <closing-icon
            :size="closingButtonSize"
          />
        </div>
      </div>
      <v-row class="py-3 py-md-8">
        <!-- md left part -->
        <v-col
          class="col-12 offset-md-1 col-md-5 offset-lg-2 col-lg-4 offset-xl-3 col-xl-3 pr-md-12 split-border"
        >
          <v-row class="align-center justify-space-between">
            <!-- title -->
            <v-col
              v-if="currentPaywall.title"
              class="col-10 col-md-12 abc-bold title-24 title-md-28 title-lg-32"
            >
              {{ currentPaywall.title }}
            </v-col>

            <!-- closing button sm-and-down -->
            <v-col
              v-if="paywalls.isResizable()"
              class="col-2 cursor-pointer hidden-md-and-up"
              @click="$store.commit('paywall/minimize', paywalls)"
            >
              <v-row class="no-gutters justify-end">
                <v-col class="col-auto">
                  <closing-icon :size="32" class="mb-3" />
                </v-col>
              </v-row>
            </v-col>

            <!-- lead -->
            <v-col
              v-if="currentPaywall.lead"
              class="col-12 abc-light font-size-16 font-size-md-18 font-size-lg-21 line-height-1-35 pb-0"
            >
              <span v-html="currentPaywall.lead" />
            </v-col>
          </v-row>
        </v-col>

        <!-- md right part -->
        <v-col class="col-12 col-md-6 pl-md-12">
          <v-row class="align-center fill-height pt-3">
            <v-col class="col-12">
              <v-row>
                <!-- subtitle -->
                <v-col
                  v-if="currentPaywall.subtitle"
                  class="col-12 abc-bold font-size-20 font-size-md-23 font-size-lg-25 text-center text-md-left pt-2 pt-md-3"
                >
                  {{ currentPaywall.subtitle }}
                </v-col>

                <!-- buttons -->
                <v-col class="col-12 col-md-auto pb-5 pb-md-3">
                  <menu-button-entries
                    container-css="justify-center"
                    :buttons="buttons"
                  />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-col>

    <!-- minimized view (only mobile. for desktop MinimizedPaywallSquare.vue is used) --->
    <v-col
      v-else
      class="col-12 cursor-pointer"
    >
      <v-row
        class="align-center"
      >
        <v-col
          class="col-6 offset-3 col-sm-4 offset-sm-4 abc-bold font-size-15 font-size-sm-20 font-size-md-24 font-size-lg-26 px-0 px-sm-3 text-center"
          @click="$router.push('/p/abo')"
        >
          {{ currentPaywall.minimizedTitle }}
        </v-col>
        <v-col
          class="col-3 col-sm-4 text-right pl-0 px-sm-3"
        >
          <v-btn
            outlined
            :small="$vuetify.breakpoint.xsOnly"
            :large="$vuetify.breakpoint.mdOnly"
            :x-large="$vuetify.breakpoint.lgAndUp"
            @click="$router.push(`/p/login?redirectPathOnLoginSuccess=${currentPath}`)"
          >
            Login
          </v-btn>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import MenuButtonEntries from '~/components/navigation/header/menu/MenuButtonEntries.vue'
import Navigations from '~/sdk/wep/models/navigation/Navigations'
import Navigation from '~/sdk/wep/models/navigation/Navigation'
import ClosingIcon from '~/components/helpers/ClosingIcon.vue'
import Paywalls from '~/sdk/wep-cms/models/paywall/Paywalls'
import Paywall from '~/sdk/wep-cms/models/paywall/Paywall'

export default Vue.extend({
  name: 'PaywallContent',
  components: { ClosingIcon, MenuButtonEntries },
  props: {
    paywalls: {
      type: Object as PropType<Paywalls | undefined>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      currentPaywall: undefined as undefined | Paywall
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
    closingButtonSize (): number {
      const breakpoint = this.$vuetify.breakpoint
      if (breakpoint.xlOnly) { return 60 }
      if (breakpoint.lgAndUp) { return 50 }
      if (breakpoint.mdAndUp) { return 45 }
      return 45
    },
    currentPath (): string {
      return this.$route.path
    }
  },
  watch: {
    currentPath () {
      this.getNextPaywall()
    }
  },
  mounted () {
    this.currentPaywall = this.paywalls?.getCurrent()
  },
  methods: {
    getNextPaywall () {
      this.$store.commit('paywall/getNext', this.paywalls)
      this.currentPaywall = this.paywalls?.getCurrent()
    }
  }
})
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/settings/variables';

.split-border {
  border-right: none;
}

@media #{map-get($display-breakpoints, 'md-and-up')} {
  .split-border {
    border-right: 1px solid white;
  }
}
</style>
