<template>
  <v-row>
    <!-- loading subscriptions -->
    <v-col
      v-if="loading"
      class="col-12"
    >
      <v-skeleton-loader
        type="image"
      />
    </v-col>
    <!-- subscriptions -->
    <v-col
      v-else-if="subscriptions && subscriptions.length"
      class="col-12"
    >
      <v-row>
        <!-- iterate subscriptions -->
        <v-col
          v-for="(subscription, subscriptionIndex) in subscriptions"
          :key="subscriptionIndex"
          class="col-12"
        >
          <user-subscription-preview
            :subscription="subscription"
            details-btn
            cancel-btn
          />
        </v-col>
      </v-row>
    </v-col>
    <!-- no abos available -->
    <v-col
      v-else-if="!subscriptions || !subscriptions.length"
      class="col-12 text-center"
    >
      <v-card outlined>
        <v-card-title>
          Kein aktives Abo
        </v-card-title>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import UserSubscriptionPreview from '~/sdk/wep/components/subscription/UserSubscriptionPreview.vue'
import Subscription from '~/sdk/wep/models/subscription/Subscription'

export default Vue.extend({
  name: 'UserSubscriptions',
  components: { UserSubscriptionPreview },
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
  }
})
</script>
