<template>
  <v-row
    v-if="memberRegistration"
  >
    <!-- create all form fields -->
    <v-col
      v-for="(formField, formFieldId) in registrationFormFields"
      :key="formFieldId"
      class="py-0"
      :class="formField.cssClass || 'col-12 col-md-6'"
    >
      <v-text-field
        :value="memberRegistration[formField.name]"
        :label="`${formField.label}${formField.required ? ' *' : ''}`"
        :rules="getRules(formField)"
        outlined
        rounded
        @input="newValue => updateMemberRegistration(formField, newValue)"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import MemberRegistration from '~/sdk/wep/models/member/MemberRegistration'
import { RegistrationFormField } from '~/sdk/wep/interfacesAndTypes/Custom'
import Address from '~/sdk/wep/models/user/Address'

export default Vue.extend({
  name: 'RegistrationForm',
  props: {
    memberRegistration: {
      type: Object as PropType<undefined | MemberRegistration>,
      required: true,
      default: undefined
    },
    registrationFormFields: {
      type: Array as PropType<RegistrationFormField[]>,
      required: true,
      default: () => []
    }
  },
  data () {
    return {
      MemberRegistration
    }
  },
  methods: {
    updateMemberRegistration (formField: RegistrationFormField, newValue: string) {
      if (!this.memberRegistration) {
        return
      }
      const address = this.memberRegistration.address
      const isAddressFormField = Object.keys(address || {}).find(key => key === formField.name)
      let updatedMemberRegistration: MemberRegistration
      // if the form field is from the address object, update the property of the address instance
      if (isAddressFormField) {
        const updatedAddress = new Address({ ...address, [formField.name]: newValue })
        updatedMemberRegistration = new MemberRegistration({ ...this.memberRegistration, address: updatedAddress })
      } else {
        updatedMemberRegistration = new MemberRegistration({ ...this.memberRegistration, [formField.name]: newValue })
      }
      this.$emit('update:memberRegistration', updatedMemberRegistration)
    },
    getRules (formField: RegistrationFormField) {
      if (!formField.required) {
        return []
      }
      // special rule for email repeate field
      if (formField.name === 'emailRepeat') {
        return [
          (v: any) => !!v || 'Bitte wiederhole deine E-Mail-Adresse.',
          (v: any) => {
            return v === this.memberRegistration?.email ||
          'E-Mail-Adressen müssen identisch sein.'
          }
        ]
      }
      return [(v: any) => !!v || formField.rule]
    }
  }
})
</script>
