<template>
  <user-profile :show-flair="false">
    <!-- custom subscription title -->
    <template #subscriptions>
      <div class="headline pb-3 pl-1">
        Abos
      </div>
      <!-- create new user login -->
      <v-row>
        <v-col class="col-12">
          <v-card outlined>
            <v-card-title>
              ...werde Hauptstädter*in
            </v-card-title>
            <v-card-actions class="justify-center">
              <v-btn
                outlined
                nuxt
                to="/p/abo"
              >
                Anderes Abo lösen
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <!-- custom invoices title -->
    <template #invoices>
      <div class="headline pl-1">
        Offene Zahlungen
      </div>
    </template>

    <template #userData>
      <div class="headline pl-1">
        Persönliche Daten
      </div>
    </template>
  </user-profile>
</template>

<script lang="ts">
import Vue from 'vue'
import UserProfile from '~/sdk/wep/components/profile/UserProfile.vue'

export default Vue.extend({
  name: 'HsProfile',
  components: { UserProfile }
})
</script>
