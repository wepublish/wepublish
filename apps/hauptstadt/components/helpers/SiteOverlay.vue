<template>
  <div
    class="overlay-container"
  >
    <v-row class="align-center justify-center fill-height">
      <v-col class="col-12">
        <v-row class="justify-center">
          <v-col class="col-12 col-md-4 px-10">
            <img src="~/assets/images/logo-with-claim.svg">
          </v-col>
          <v-col class="col-12 text-center pt-12 px-6">
            <p class="title-30 tiempos-semibold">
              Auf dieser Seite testen wir die Hauptstadt bloss.
            </p>
          </v-col>
          <v-col class="col-12 text-center pt-6 px-6">
            <a :href="redirectUrl" class="caption-20">Hier geht's zur richtigen Hauptstadt.</a>
          </v-col>
        </v-row>
      </v-col>

      <!-- login -->
      <v-col
        v-if="password"
        class="col-auto align-self-end px-6"
      >
        <v-text-field
          v-model="comparePassword"
          label="Passwort"
          type="password"
          dense
          outlined
          hide-details
          append-icon="fal fa-chevron-right"
          @click:append="login()"
          @keyup.enter="login()"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
export default Vue.extend({
  name: 'SiteOverlay',
  props: {
    redirectUrl: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    password: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      comparePassword: null as null | string,
      cookiePasswordKey: 'overlayPassword' as string
    }
  },
  beforeMount () {
    this.autoLogin()
  },
  methods: {
    autoLogin (): void {
      const passwordFromCookies = this.$cookies.get(this.cookiePasswordKey)
      if (passwordFromCookies) {
        this.comparePassword = passwordFromCookies
        this.login()
      }
    },
    login () {
      if (this.password === this.comparePassword) {
        this.$cookies.set(this.cookiePasswordKey, this.password)
        this.$emit('hide')
      }
    }
  }
})
</script>

<style lang="scss">
.overlay-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
  z-index: 999;
}
</style>
