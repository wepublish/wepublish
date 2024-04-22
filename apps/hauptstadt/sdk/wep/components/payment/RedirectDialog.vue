<template>
  <v-dialog
    :value="value"
    scrollable
    width="500"
    persistent
    @input="value => $emit('update:value', value)"
  >
    <v-card v-if="redirectLink">
      <v-card-title>
        So geht's weiter
      </v-card-title>

      <v-card-text>
        <a
          :href="redirectLink"
          target="_blank"
          class="black--text subtitle text-decoration-underline"
        >
          Wenn sich kein neues Fenster zur Bezahlung geöffnet hat, klicke diesen Link.
        </a>

        <!-- logged in user -->
        <div v-if="loggedIn">
          <br>
          Nach erfolgreicher Bezahlung kannst Du ins Dashboard zurückkehren.
        </div>
        <!-- new registration -->
        <div v-else>
          <br>
          Nach erfolgreicher Bezahlung kannst Du dieses Fenster schliessen.
        </div>
      </v-card-text>
      <v-card-actions
        v-if="loggedIn"
        class="text-center"
      >
        <v-row class="justify-center no-gutters">
          <v-col class="col-auto">
            <back-to-btn large outlined>
              Zurück zum Profil
            </back-to-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import BackToBtn from '~/sdk/wep/components/helpers/BackToBtn.vue'

export default Vue.extend({
  name: 'RedirectDialog',
  components: { BackToBtn },
  props: {
    value: {
      type: Boolean as PropType<boolean>,
      required: true,
      default: false
    },
    redirectLink: {
      type: String as PropType<undefined | string>,
      required: false,
      default: undefined
    },
    loggedIn: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  }
})
</script>
