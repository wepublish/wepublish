<template>
  <v-btn
    :to="path"
    nuxt
    :large="large"
    :outlined="outlined"
    :rounded="rounded"
    :x-large="xLarge"
  >
    <span class="fal fa-chevron-left mr-1" />
    <slot />
  </v-btn>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
export default Vue.extend({
  name: 'BackToBtn',
  props: {
    large: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    xLarge: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    outlined: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    rounded: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  computed: {
    path (): string {
      const path = this.$config.DASHBOARD_PATH
      if (!path) {
        const exceptionMessage = 'No DASHBOARD_PATH configured in nuxt.config!'
        if (this.$sentry) {
          this.$sentry.captureException(exceptionMessage)
        }
        throw new Error(exceptionMessage)
      }
      return path
    }
  }
})
</script>
