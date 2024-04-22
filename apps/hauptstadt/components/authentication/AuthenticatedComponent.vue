<template>
  <div>
    <user-interaction-offline
      v-if="$config.USER_INTERACTION_OFFLINE"
      offline-function="Profil"
    />
    <slot v-else-if="loggedIn" />
    <v-row
      v-else
      class="justify-center"
    >
      <v-col class="col-12 max-width-680">
        <login-form
          :redirect-path-on-login-success="$route.fullPath"
          hide-registration
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import LoginForm from '~/sdk/wep/components/authentication/LoginForm.vue'
import UserInteractionOffline from '~/sdk/wep/components/helpers/UserInteractionOffline.vue'

export default Vue.extend({
  name: 'AuthenticatedComponent',
  components: { UserInteractionOffline, LoginForm },
  computed: {
    loggedIn (): boolean {
      return this.$store.getters['auth/loggedIn']
    }
  }
})
</script>
