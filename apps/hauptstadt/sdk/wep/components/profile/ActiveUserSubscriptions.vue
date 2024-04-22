<template>
  <v-row>
    <v-col class="col-12">
      <user-subscriptions
        :subscriptions="activeSubscriptions"
        :loading="loading"
      />
    </v-col>
    <v-col
      v-if="hasInactiveSubscriptions"
      class="col-12 text-center"
    >
      <nuxt-link
        :to="$config.DEACTIVATED_ABOS_PATH"
      >
        Gekündete Abos anzeigen
      </nuxt-link>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import UserSubscriptions from '~/sdk/wep/components/subscription/UserSubscriptions.vue'

export default Vue.extend({
  name: 'ActiveUserSubscriptions',
  components: { UserSubscriptions },
  props: {
    subscriptions: {
      type: Array as PropType<Subscription[]>,
      required: false,
      default: () => []
    },
    loading: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  computed: {
    activeSubscriptions (): Subscription[] {
      return this.subscriptions.filter(subscription => !subscription.isDeactivated())
    },
    hasInactiveSubscriptions (): boolean {
      const amountActiveSubscriptions = this.activeSubscriptions.length
      const amountAllSubscriptions = this.subscriptions.length
      return amountActiveSubscriptions < amountAllSubscriptions
    }
  }
})
</script>
