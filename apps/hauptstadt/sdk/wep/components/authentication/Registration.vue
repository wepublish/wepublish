<template>
  <v-row>
    <!-- login in progress -->
    <v-col
      v-if="loginInProgress"
      class="col-12"
    >
      <login-in-progress />
    </v-col>

    <!-- already logged-in -->
    <v-col
      v-else-if="loggedIn"
      class="col-12"
    >
      <slot name="loggedIn" />
    </v-col>

    <!-- registration -->
    <v-col
      v-else
      class="col-12"
    >
      <v-row class="align-center">
        <v-col class="col-12">
          <slot name="title" />
        </v-col>
        <v-col class="col-12">
          <v-form
            ref="registrationFormRef"
            @submit.prevent=""
          >
            <registration-form
              :registration-form-fields="registrationFormFields"
              :member-registration.sync="memberRegistration"
            />
            <PasswordForm
              rounded
              :password="password"
              placeholder="Passwort *"
              placeholder-repeat="Passwort wiederholen *"
              :css-class="password.password ? 'col-12 col-md-6' : undefined"
              @input:password="value => password.password = value"
              @input:passwordRepeated="value => setPasswordRepeated(value)"
            />
          </v-form>
        </v-col>
        <v-col class="col-12 col-sm-8 pt-0">
          <challenge-view
            ref="challengeView"
            :rounded="rounded"
            :challenge.sync="challenge"
            :challenge-answer.sync="challengeAnswer"
            @enter="register()"
          />
        </v-col>
        <v-col
          v-show="challenge"
          class="col-12 col-sm-4 text-right pt-0"
        >
          <v-btn
            :class="{'mt-n14': $vuetify.breakpoint.smAndDown}"
            color="primary"
            large
            :rounded="rounded"
            @click="register()"
          >
            Registrieren
          </v-btn>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import RegistrationForm from '~/sdk/wep/components/payment/RegistrationForm.vue'
import { RegistrationFormField } from '~/sdk/wep/interfacesAndTypes/Custom'
import MemberRegistration from '~/sdk/wep/models/member/MemberRegistration'
import { VForm } from '~/sdk/wep/interfacesAndTypes/Vuetify'
import MemberService from '~/sdk/wep/services/MemberService'
import ChallengeView from '~/sdk/wep/components/authentication/ChallengeView.vue'
import Challenge from '~/sdk/wep/models/challenge/Challenge'
import ChallengeAnswer from '~/sdk/wep/models/challenge/ChallengeAnswer'
import LoginInProgress from '~/sdk/wep/components/authentication/LoginInProgress.vue'
import PasswordForm from '~/sdk/wep/components/authentication/PasswordForm.vue'
import Password from '~/sdk/wep/classes/Password'

export default Vue.extend({
  name: 'Registration',
  components: { PasswordForm, LoginInProgress, ChallengeView, RegistrationForm },
  props: {
    registrationFormFields: {
      type: Array as PropType<RegistrationFormField[]>,
      required: true,
      default: () => []
    },
    fallbackRedirectPath: {
      type: String as PropType<string>,
      required: true
    },
    rounded: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  data () {
    return {
      memberRegistration: new MemberRegistration({}) as MemberRegistration,
      challenge: undefined as undefined | Challenge,
      challengeAnswer: new ChallengeAnswer({}) as ChallengeAnswer,
      password: new Password() as Password
    }
  },
  computed: {
    loginInProgress (): boolean {
      return this.$store.getters['auth/authInProgress']
    },
    loggedIn (): boolean {
      return this.$store.getters['auth/loggedIn']
    },
    redirectPath (): string {
      const pathFromParams = this.$route.query.redirectPath
      if (typeof pathFromParams === 'string') {
        return pathFromParams
      }
      return this.fallbackRedirectPath
    }
  },
  methods: {
    async register () {
      if (!this.validateForm()) { return false }

      // set challenge answer
      this.memberRegistration.challengeAnswer = this.challengeAnswer
      // set password
      this.memberRegistration.password = this.password.password

      const memberService = new MemberService({ vue: this })
      const response = await memberService.registerMember({ memberRegistration: this.memberRegistration })

      if (!response || !response?.session?.token) {
        // re-load the challenge
        (this.$refs.challengeView as unknown as any)?.$fetch()
        return false
      }

      // login user
      await this.$store.dispatch('auth/loginWithSession', {
        vue: this,
        $apollo: this.$apollo,
        $apolloHelpers: this.$apolloHelpers,
        session: response.session.token
      })
      await this.$router.push({ path: this.redirectPath })
    },
    validateForm (): boolean {
      const form = this.$refs.registrationFormRef as VForm
      return form.validate()
    },
    setPasswordRepeated (value: string | undefined): void {
      this.password.passwordRepeated = value
      this.validateForm()
    }
  }
})
</script>
