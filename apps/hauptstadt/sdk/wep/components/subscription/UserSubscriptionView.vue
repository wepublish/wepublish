<template>
  <v-row>
    <!-- loading -->
    <v-col
      v-if="fetching"
      class="col-12"
    >
      <v-skeleton-loader type="card" />
    </v-col>
    <!-- error -->
    <v-col
      v-else-if="$fetchState.error || !subscription"
      class="col-12"
    >
      <v-alert outlined color="primary">
        Beim Anzeigen des Abos ist ein Fehler aufgetreten. Wende Dich an {{ $config.TECHNICAL_ISSUER_MAIL }}
      </v-alert>
    </v-col>
    <!-- subscription successfully loaded -->
    <v-col
      v-else-if="subscription"
      class="col-12"
    >
      <v-row>
        <!-- back btn -->
        <v-col class="col-12">
          <back-to-btn outlined>
            Zurück zum Profil
          </back-to-btn>
        </v-col>

        <v-col class="col-12">
          <UserSubscriptionPreview
            :subscription="subscription"
            cancel-btn
          />
        </v-col>
        <!-- invoice history -->
        <v-col class="col-12 headline pt-8">
          Zahlungen
        </v-col>
        <v-col class="col-12">
          <invoice-list
            :subscriptions="subscriptions"
            filter="subscriptionId"
            :filter-subscription-id="id"
          />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import UserSubscriptionPreview from '~/sdk/wep/components/subscription/UserSubscriptionPreview.vue'
import BackToBtn from '~/sdk/wep/components/helpers/BackToBtn.vue'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import InvoiceList from '~/sdk/wep/components/invoice/InvoiceList.vue'
import User from '~/sdk/wep/models/user/User'

export default Vue.extend({
  name: 'UserSubscriptionView',
  components: { InvoiceList, BackToBtn, UserSubscriptionPreview },
  props: {
    id: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    }
  },
  async fetch () {
    // refresh subscriptions and invoices
    await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', { vue: this, lazyLoad: true })
  },
  computed: {
    user (): undefined | User {
      return this.$store.getters['auth/me']
    },
    subscriptions (): undefined | Subscriptions {
      return this.user?.subscriptions
    },
    subscription (): undefined | Subscription {
      return this.subscriptions?.subscriptions.find(tmpSubscription => tmpSubscription.id === this.id)
    },
    fetching (): boolean {
      return this.$store.getters['auth/fetching']
    }
  },
  fetchOnServer: false
})
</script>
