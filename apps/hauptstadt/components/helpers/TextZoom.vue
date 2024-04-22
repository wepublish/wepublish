<template>
  <v-row>
    <v-col
      class="white-space-nowrap"
      @click="openZoomModal()"
    >
      <span class="fal fa-text-size" /> <span class="text-decoration-underline">Schrift</span>
    </v-col>

    <!-- set custom font size -->
    <v-bottom-sheet
      v-model="showZoomModal"
      inset
      hide-overlay
      max-width="680"
    >
      <v-sheet>
        <v-row class="justify-center align-center py-4">
          <v-col class="col-12 text-center title-24">
            Schriftgrösse einstellen
          </v-col>

          <v-col class="col-12 py-0 text-center">
            <v-btn
              icon
              @click="resetZoom()"
            >
              <span class="fal fa-undo" />
            </v-btn>
          </v-col>

          <!-- slider -->
          <v-col class="col-auto pl-6 pr-1 pt-0">
            <span class="fal fa-text fa-1x" />
          </v-col>
          <v-col class="col-6 px-0 pt-0">
            <v-slider
              :value="zoomLevel"
              :step="1"
              :min="1"
              :max="9"
              hide-details
              color="primary"
              @input="updateZoom"
            />
          </v-col>
          <v-col class="col-auto pl-1 pt-0">
            <span class="fal fa-text fa-2x" />
          </v-col>
        </v-row>
      </v-sheet>
    </v-bottom-sheet>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'TextZoom',
  data () {
    return {
      showZoomModal: false as boolean
    }
  },
  computed: {
    zoomLevel () {
      return this.$store.getters['textZoom/zoomLevel']
    }
  },
  methods: {
    openZoomModal (): void {
      this.showZoomModal = true
    },
    // change zoom
    async updateZoom (newZoomLevel): Promise<void> {
      await this.$store.dispatch('textZoom/updateZoom', {
        newZoomLevel: parseInt(newZoomLevel),
        vue: this
      })
    },
    async resetZoom (): Promise<void> {
      await this.$store.dispatch('textZoom/resetZoom', {
        vue: this
      })
    }
  }
})
</script>
