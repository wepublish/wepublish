<template>
  <v-row class="align-center justify-center">
    <v-col
      class="col-12"
    >
      <!-- login in progress -->
      <login-in-progress
        v-if="loginInProgress"
      />

      <!-- forms -->
      <v-row v-else class="justify-space-around">
        <v-col
          class="col-12"
          :class="[{'col-sm-6': !hideRegistration}]"
        >
          <v-row>
            <!-- show normal login form -->
            <v-col class="col-12">
              <v-btn-toggle
                :rounded="rounded"
              >
                <v-btn
                  :rounded="rounded"
                  :small="!hideRegistration"
                  :class="[loginMode === 'mailLogin' ? 'white--text primary' : 'white']"
                  @click="setLoginMode('mailLogin')"
                >
                  Mail-Login
                </v-btn>

                <v-btn
                  :rounded="rounded"
                  :small="!hideRegistration"
                  :class="[loginMode === 'credentialsLogin' ? 'white--text primary' : 'white']"
                  @click="setLoginMode('credentialsLogin')"
                >
                  Login mit Passwort
                </v-btn>
              </v-btn-toggle>
            </v-col>

            <!-- login via mail link -->
            <v-col
              v-if="loginMode === 'mailLogin'"
              class="col-12 text-right"
            >
              <v-form
                ref="mailLoginFormRef"
                @submit.prevent=""
              >
                <v-text-field
                  id="emailTextFieldId"
                  v-model="email"
                  tabindex="0"
                  outlined
                  label="E-Mail"
                  type="email"
                  :rounded="rounded"
                  :rules="[v => !!v || 'Bitte gib deine E-Mail-Adresse ein.']"
                  @keyup.enter="mailLogin()"
                />
              </v-form>
              <v-btn
                :rounded="rounded"
                outlined
                color="black"
                :block="!hideRegistration"
                large
                :loading="$nuxt.$loading.show"
                @click="mailLogin()"
              >
                Login-Link anfordern
              </v-btn>
            </v-col>

            <!-- login form with mail and password -->
            <v-col
              v-else-if="loginMode === 'credentialsLogin'"
              class="col-12"
            >
              <v-row class="align-center justify-space-between">
                <v-col class="col-12">
                  <v-form
                    ref="credentialsLoginRef"
                    @submit.prevent=""
                  >
                    <v-text-field
                      id="credentialsTextFieldId"
                      v-model="email"
                      outlined
                      :rounded="rounded"
                      label="E-Mail"
                      :rules="[v => !!v || 'Bitte gib deine E-Mail-Adresse ein.']"
                      type="email"
                      @keyup.enter="credentialsLogin()"
                    />
                    <v-text-field
                      v-model="password"
                      outlined
                      :rounded="rounded"
                      :type="showPassword ? 'text' : 'password'"
                      label="Passwort"
                      :append-icon="showPassword ? 'fal fa-eye' : 'fal fa-eye-slash'"
                      :rules="[v => !!v || 'Bitte gib dein Passwort ein.']"
                      @click:append="showPassword = !showPassword"
                      @keyup.enter="credentialsLogin()"
                      @keydown.tab="$refs.credentialsLoginBtnRef.$el.focus()"
                    />
                  </v-form>
                </v-col>
                <v-col class="col-auto pt-0">
                  <a @click.prevent="setLoginMode('mailLogin')">Passwort vergessen?</a>
                </v-col>
                <!-- login button -->
                <v-col class="col-auto pt-0">
                  <v-btn
                    ref="credentialsLoginBtnRef"
                    outlined
                    :rounded="rounded"
                    color="black"
                    large
                    :loading="$nuxt.$loading.show"
                    @click="credentialsLogin()"
                  >
                    <span class="fal fa-sign-in mr-1" />
                    Login
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-col>

        <v-col
          v-if="!hideRegistration"
          class="col-12 col-sm-auto pt-6"
        >
          <v-divider :vertical="$vuetify.breakpoint.smAndUp" />
        </v-col>

        <v-col
          v-if="!hideRegistration"
          class="col-auto text-center headline align-self-center"
        >
          <register-link />
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { LoginMode, LoginResponse } from '~/sdk/wep/interfacesAndTypes/Custom'
import { VForm } from '~/sdk/wep/interfacesAndTypes/Vuetify'
import LoginInProgress from '~/sdk/wep/components/authentication/LoginInProgress.vue'
import RegisterLink from '~/sdk/wep/components/authentication/RegisterLink.vue'

export default Vue.extend({
  name: 'LoginForm',
  components: { RegisterLink, LoginInProgress },
  props: {
    // causes the site after login success to re-load. If undefined, the site will not be re-loaded.
    // Used when log-in in the comments. We don't want the site to re-load.
    redirectPathOnLoginSuccess: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    allowFocusInput: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    rounded: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    hideRegistration: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  data () {
    return {
      loginMode: 'mailLogin' as LoginMode,
      showPassword: false as boolean,
      email: null as null | string,
      password: null as null | string
    }
  },
  computed: {
    loggedIn (): boolean {
      return this.$store.getters['auth/loggedIn']
    },
    mailQuery (): string | null | (string | null)[] {
      return this.$route.query.mail
    },
    loginInProgress (): boolean {
      return this.$store.getters['auth/authInProgress']
    }
  },
  watch: {
    loggedIn: {
      handler () {
        if (this.loggedIn) {
          this.redirectOnLoginSuccess()
        }
      },
      immediate: true,
      deep: true
    }
  },
  mounted () {
    // preset mail from query
    if (typeof this.mailQuery === 'string') {
      this.email = this.mailQuery
    }
    this.focusInput()
  },
  methods: {
    focusInput (): void {
      if (!this.allowFocusInput) {
        return
      }
      this.$nextTick(() => {
        const mailTextField = document.getElementById('emailTextFieldId')
        if (mailTextField) {
          mailTextField.focus()
          return
        }
        const credentialsTextField = document.getElementById('credentialsTextFieldId')
        if (credentialsTextField) {
          credentialsTextField.focus()
        }
      })
    },
    // login with credentials by user
    async credentialsLogin (): Promise<void> {
      if (!(this.$refs.credentialsLoginRef as VForm).validate()) {
        return
      }
      await this.$store.dispatch('auth/createSession', {
        vue: this,
        $apolloHelpers: this.$apolloHelpers,
        email: this.email,
        password: this.password
      })
      this.$emit('logged-in-with-credentials')
    },
    async mailLogin (): Promise<void> {
      if (!(this.$refs.mailLoginFormRef as VForm).validate()) {
        return
      }
      const response: LoginResponse = await this.$store.dispatch('auth/sendWebsiteLogin', {
        vue: this,
        $apolloHelpers: this.$apolloHelpers,
        email: this.email
      })
      if (response === 'login-link-sent') {
        this.$nuxt.$emit('alert', {
          title: 'Ein Login-Link wurde dir per Mail zugestellt. Dies kann einen Moment dauern. Bitte prüfe auch deinen Spam-Ordner.',
          type: 'success'
        })
        this.$emit('login-link-sent')
      } else {
        this.$nuxt.$emit('alert', { title: 'E-Mail mit Login-Link konnte nicht versendet werden.', type: 'error' })
      }
    },
    setLoginMode (loginMode: LoginMode): void {
      this.loginMode = loginMode
      this.focusInput()
    },
    async redirectOnLoginSuccess (): Promise<void> {
      this.$nuxt.$emit('alert', {
        title: 'Erfolgreich eingeloggt.',
        type: 'success'
      })
      if (!this.redirectPathOnLoginSuccess) {
        return
      }
      // Forces site reload which runs the middleware in default.vue and set cookie with one year lifetime server-side.
      // ITP Safari workaround since: https://www.cookiestatus.com/safari/
      const origin = window.location.origin
      if (origin) {
        // FIX 21.02.2023 => Redirects to open invoice on site reload!
        window.location.href = `${origin}${this.redirectPathOnLoginSuccess}`
      } else {
        if (!this.$sentry) {
          return
        }
        this.$sentry.captureMessage(`Origin not found. Required site reload not performed after login for token ${this.$apolloHelpers.getToken()}`)
        await this.$router.push(this.redirectPathOnLoginSuccess)
      }
    }
  }
})
</script>
