<template>
  <v-row>
    <!-- password -->
    <v-col
      class="col-12 py-0"
      :class="cssClass"
    >
      <v-text-field
        :value="password.password"
        :rounded="rounded"
        outlined
        :label="label"
        :placeholder="placeholder"
        :type="showPassword ? 'text' : 'password'"
        autocomplete="new-password"
        :append-icon="password.password ? showPassword ? 'fal fa-eye' : 'fal fa-eye-slash' : undefined"
        :rules="[v => password.isValid({
          passwordLength: 8,
          skipEmptyPassword
        })]"
        :validate-on-blur="false"
        persistent-placeholder
        @input="(value) => setPassword(value)"
        @click:append="showPassword = !showPassword"
      />
    </v-col>

    <!-- password repeated -->
    <v-col
      v-if="password.password"
      class="col-12 py-0"
      :class="cssClass"
    >
      <v-text-field
        :value="password.passwordRepeated"
        :rounded="rounded"
        outlined
        :label="labelRepeat"
        :placeholder="placeholderRepeat"
        :type="showPasswordRepeated ? 'text' : 'password'"
        :append-icon="showPasswordRepeated ? 'fal fa-eye' : 'fal fa-eye-slash'"
        @input="(value) => $emit('input:passwordRepeated', value)"
        @click:append="showPasswordRepeated = !showPasswordRepeated"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Password from '~/sdk/wep/classes/Password'

export default Vue.extend({
  name: 'PasswordForm',
  props: {
    password: {
      type: Object as PropType<Password>,
      required: true
    },
    rounded: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    skipEmptyPassword: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    },
    placeholder: {
      type: String as PropType<string>,
      required: false,
      default: undefined
    },
    placeholderRepeat: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    label: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    labelRepeat: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    },
    cssClass: {
      type: String as PropType<string | undefined>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      showPassword: false as boolean,
      showPasswordRepeated: false as boolean
    }
  },
  methods: {
    setPassword (password: string): void {
      // reset passwort
      if (password === '') {
        this.$emit('input:password', undefined)
        this.$emit('input:passwordRepeated', undefined)
      } else {
        this.$emit('input:password', password)
      }
    }
  }
})
</script>
