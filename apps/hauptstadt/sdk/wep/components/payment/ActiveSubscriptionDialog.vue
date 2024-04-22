<template>
  <v-dialog
    :value="value"
    scrollable
    max-width="550"
    persistent
    @input="value => $emit('update:value', value)"
  >
    <v-card>
      <v-card-title>
        Sie haben bereits ein aktives Abo.
      </v-card-title>
      <v-card-subtitle>
        Wollen Sie ein zusätzliches lösen?
      </v-card-subtitle>
      <v-card-actions>
        <v-row
          class="justify-space-between row--dense"
        >
          <v-col class="col-12 col-md-auto text-center order-1 order-md-0">
            <back-to-btn outlined>
              Zurück zum Profil
            </back-to-btn>
          </v-col>
          <v-col class="col-12 col-md-auto text-center order-0 order-md-1">
            <v-btn
              color="primary"
              elevation="0"
              @click="$emit('checkout')"
            >
              Ja, zusätzliches Abo lösen
            </v-btn>
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
  name: 'ActiveSubscriptionDialog',
  components: { BackToBtn },
  props: {
    value: {
      type: Boolean as PropType<boolean>,
      required: true,
      default: false
    }
  }
})
</script>
