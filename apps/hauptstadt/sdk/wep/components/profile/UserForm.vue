<template>
  <div v-if="user && user.address">
    <v-form
      ref="userFormRef"
      @submit.prevent=""
    >
      <v-row>
        <!-- profile image -->
        <v-col class="col-12">
          <profile-image
            v-if="!hideProfileImage"
            :user="user"
            @update:user="(newUser) => $store.commit('auth/setMe', newUser)"
          />
        </v-col>

        <!-- first name -->
        <v-col class="col-12 col-md-6 pb-0">
          <v-text-field
            :value="user.firstName"
            :rules="[v => !!v || 'Deinen Vornamen, bitte']"
            outlined
            label="Vorname"
            @input="(firstName) => setUser({firstName})"
          />
        </v-col>
        <!-- last name -->
        <v-col class="col-12 col-md-6 pb-0">
          <v-text-field
            :value="user.name"
            :rules="[v => !!v || 'Deinen Nachnamen, bitte']"
            outlined
            label="Nachname"
            @input="(name) => setUser({name})"
          />
        </v-col>
        <!-- flair -->
        <v-col v-if="showFlair" class="col-12 py-0">
          <v-text-field
            :value="user.flair"
            outlined
            label="Funktion / Beruf"
            @input="(flair) => setUser({flair})"
          />
        </v-col>
        <!-- address -->
        <v-col
          class="col-12 py-0"
        >
          <v-text-field
            :value="user.address.streetAddress"
            :rules="[v => !!v || 'deine Adresse, bitte']"
            outlined
            label="Adresse"
            @input="(streetAddress) => setUser({streetAddress})"
          />
        </v-col>
        <!-- zip -->
        <v-col
          class="col-6 col-md-4 py-0"
        >
          <v-text-field
            :value="user.address.zipCode"
            :rules="[v => !!v || 'deine PLZ, bitte']"
            outlined
            label="PLZ"
            @input="(zipCode) => setUser({zipCode})"
          />
        </v-col>
        <!-- city -->
        <v-col
          class="col-6 col-md-8 py-0"
        >
          <v-text-field
            :value="user.address.city"
            :rules="[v => !!v || 'deinen Wohnort, bitte']"
            outlined
            label="Ort"
            @input="(city) => setUser({city})"
          />
        </v-col>
        <!-- country -->
        <v-col
          class="col-12 py-0"
        >
          <v-text-field
            :value="user.address.country"
            :rules="[v => !!v || 'dein Land, bitte']"
            outlined
            label="Land"
            @input="(country) => setUser({country})"
          />
        </v-col>

        <v-col class="col-12 py-0">
          <password-form
            skip-empty-password
            label="Passwort"
            label-repeat="Passwort wiederholen"
            placeholder="Passwort ändern? Sonst leer lassen."
            placeholder-repeat="Password wiederholen"
            :password="password"
            @input:password="input => setPassword(input)"
            @input:passwordRepeated="input => setPasswordRepeated(input)"
          />
        </v-col>

        <!-- e-mail -->
        <v-col class="col-12 py-0">
          <v-text-field
            :value="user.email"
            outlined
            label="E-Mailadresse (nicht bearbeitbar)"
            disabled
            :hint="`Wenn du deine E-Mail ändern möchtest, melde dich bei ${$config.TECHNICAL_ISSUER_MAIL}`"
            persistent-hint
          />
        </v-col>

        <!-- save btn -->
        <v-col class="col-12 text-center">
          <v-btn
            outlined
            color="black"
            large
            @click="updateUser()"
          >
            Speichern
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import UserService from '../../services/UserService'
import { VForm } from '~/sdk/wep/interfacesAndTypes/Vuetify'
import User from '~/sdk/wep/models/user/User'
import Password from '~/sdk/wep/classes/Password'
import ProfileImage from '~/sdk/wep/components/profile/ProfileImage.vue'
import PasswordForm from '~/sdk/wep/components/authentication/PasswordForm.vue'

export default Vue.extend({
  name: 'UserForm',
  components: { PasswordForm, ProfileImage },
  props: {
    showFlair: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: true
    }
  },
  data () {
    return {
      password: new Password()
    }
  },
  computed: {
    user (): undefined | User {
      return this.$store.getters['auth/me']
    },
    hideProfileImage (): boolean {
      return this.$config.MEDIUM_SLUG === 'HAS'
    }
  },
  methods: {
    setUser (
      { name, firstName, streetAddress, zipCode, city, country, flair }:
        { name?: string, firstName?: string, streetAddress?: string, zipCode?: string, city?: string, country?: string, flair?: string }
    ): void {
      this.$store.commit('auth/setMePartially', { name, firstName, streetAddress, zipCode, city, country, flair })
    },
    async updateUser (): Promise<void> {
      if (!this.validateForm()) {
        return
      }
      // 1. save password
      const userService: UserService = new UserService({ vue: this })
      if (!this.password.emptyPassword()) {
        await userService.updatePassword({ password: this.password })
        this.password = new Password()
      }
      // 2. save user
      if (!this.user) {
        throw new Error('User object is not defined in UserForm.vue!')
      }

      // try to fix https://wepublish.atlassian.net/browse/HAS-12
      await this.$nextTick(async () => {
        const newUser = await userService.updateUser({
          user: {...this.user!.getMutationObject(), email: this.user!.email}
        })
        if (newUser) {
          await this.$store.dispatch('auth/setMeAndFetchAdditionalUserData', { vue: this, me: newUser })
        }
      })
    },
    validateForm (): boolean {
      return (this.$refs.userFormRef as VForm).validate()
    },
    setPassword (value: string | undefined) {
      this.password.password = value
    },
    setPasswordRepeated (value: string | undefined) {
      this.password.passwordRepeated = value
      this.validateForm()
    }
  }
})
</script>
