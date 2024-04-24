<template>
  <v-row
    v-if="user"
    class="flex-nowrap align-center"
  >
    <v-col class="col-auto pr-0">
      <!-- user profile picture -->
      <img
        v-if="user.image"
        :src="user.image.getUrl($vuetify)"
        class="border-radius-50 border-1-px-solid-secondary"
        style="width: 150px; height: 150px; object-fit: cover;"
      >

      <!-- fallback icon -->
      <div
        v-else
        class="border-radius-50 border-1-px-solid-secondary mr-3"
        style="height: 78px; width: 78px;"
      >
        <span
          class="fas fa-user font-size-60 mt-1 ml-3 secondary--text"
        />
      </div>
    </v-col>
    <!-- remove profile picture -->
    <v-col
      v-if="user.image"
      class="col-auto pl-0 pr-2"
    >
      <v-btn
        icon
        large
        color="error"
        @click="uploadProfilePicture(null)"
      >
        <span class="fal fa-trash font-size-24" />
      </v-btn>
    </v-col>
    <!-- file input -->
    <v-col class="col-auto pl-0">
      <v-file-input
        ref="fileInput"
        truncate-length="50"
        hide-input
        accept=".png, .jpg, .jpeg, .JPG, .JPEG, .PNG"
        :prepend-icon="user.image ? 'fal fa-pen' : 'fal fa-file-upload'"
        class="mt-0 pt-0 pr-0"
        @change="uploadProfilePicture"
      />
      <span v-if="!user.image">
        Jetzt Profilbild hochladen
      </span>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { UploadImageInput } from '~/sdk/wep/models/image/WepImage'
import User from '~/sdk/wep/models/user/User'
import UserService from '~/sdk/wep/services/UserService'

export default Vue.extend({
  name: 'ProfileImage',
  props: {
    user: {
      type: Object as PropType<undefined | User>,
      required: false,
      default: undefined
    }
  },
  data () {
    return {
      imageUploadInput: undefined as undefined | UploadImageInput
    }
  },
  methods: {
    async uploadProfilePicture (file?: File | null) {
      if (file === undefined) {
        return
      }

      const response = await new UserService({ vue: this })
        .uploadUserProfileImage({ uploadImageInput: file ? { file } : null })
      if (response) {
        this.$emit('update:user', response)
      }
    }
  }
})
</script>
