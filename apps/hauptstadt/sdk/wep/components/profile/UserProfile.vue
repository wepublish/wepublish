<template>
  <v-row>
    <!-- edit subscriptions -->
    <v-col
      class="col-12 col-sm-6 col-lg-4 pr-md-6 order-1 order-sm-1 order-lg-0"
    >
      <!-- custom subscriptions title -->
      <slot name="subscriptions" />
      <active-user-subscriptions
        :subscriptions="subscriptionArray"
        :loading="$fetchState.pending"
      />
    </v-col>

    <!-- edit user data -->
    <v-col class="col-12 col-sm-6 col-lg-4 pl-md-6 order-2 order-sm2 order-lg-1">
      <!-- custom user data title -->
      <slot name="userData" />
      <user-form class="mt-3" :show-flair="showFlair" />
    </v-col>

    <!-- invoices -->
    <v-col class="col-12 col-sm-6 col-lg-4 px-md-6 order-0 order-sm-0 order-lg-2">
      <!-- custom invoices title -->
      <slot name="invoices" />
      <invoice-list
        :subscriptions="subscriptions"
        filter="open"
        class="mt-0"
      >
        <template #noInvoices>
          <v-card outlined>
            <v-card-title>
              Keine offenen Zahlungen
              <span class="fal fa-check ml-2" />
            </v-card-title>
          </v-card>
        </template>
      </invoice-list>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import UserForm from '~/sdk/wep/components/profile/UserForm.vue'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import ActiveUserSubscriptions from '~/sdk/wep/components/profile/ActiveUserSubscriptions.vue'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import InvoiceList from '~/sdk/wep/components/invoice/InvoiceList.vue'
import User from '~/sdk/wep/models/user/User'

export default Vue.extend({
  name: 'UserProfile',
  components: { InvoiceList, ActiveUserSubscriptions, UserForm },
  props: {
    showFlair: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: true
    }
  },
  data () {
    return {
      loadingSubscriptions: false as boolean
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
    subscriptionArray (): Subscription[] {
      return this.subscriptions?.subscriptions || []
    }
  },
  fetchOnServer: false
})
</script>
