<template>
  <v-row>
    <v-col class="col-12">
      <back-to-btn outlined large>
        Zurück zum Profil
      </back-to-btn>
    </v-col>
    <v-col class="col-12">
      <user-subscriptions
        :subscriptions="deactivatedSubscriptions"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'
import BackToBtn from '~/sdk/wep/components/helpers/BackToBtn.vue'
import UserSubscriptions from '~/sdk/wep/components/subscription/UserSubscriptions.vue'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import User from '~/sdk/wep/models/user/User'

export default Vue.extend({
  name: 'DeactivatedSubscriptions',
  components: { BackToBtn, UserSubscriptions },
  async fetch () {
    // refresh subscriptions and invoices
    await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', { vue: this })
  },
  computed: {
    user (): undefined | User {
      return this.$store.getters['auth/me']
    },
    subscriptions (): undefined | Subscriptions {
      return this.user?.subscriptions
    },
    deactivatedSubscriptions (): Subscription[] {
      return (this.subscriptions?.subscriptions || []).filter(subscription => subscription.isDeactivated())
    }
  },
  fetchOnServer: false
})
</script>
