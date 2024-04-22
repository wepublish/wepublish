<template>
  <v-row
    class="flex-nowrap px-1"
  >
    <v-col
      v-for="(platform, platformIndex) in platformsToShow"
      :key="platformIndex"
      class="col-auto text-center px-2"
    >
      <v-btn
        icon
        small
        :color="platform.color"
        :href="platform.name !== 'copy' ? platform.href : undefined"
        target="_blank"
        @click="copyLink(platform)"
      >
        <span :class="platform.icon" class="fa-2x" />
      </v-btn>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import { SocialMedia, SocialMediaName } from '~/sdk/wep/interfacesAndTypes/Custom'

export default Vue.extend({
  name: 'SocialMediaLinks',

  props: {
    shareLink: {
      type: String as PropType<string>,
      required: true
    },
    platforms: {
      type: Array as PropType<SocialMediaName[]>,
      required: true
    }
  },
  computed: {
    platformDefinitions (): SocialMedia[] {
      return [{
        name: 'facebook',
        color: '#4267B2',
        href: `https://www.facebook.com/sharer/sharer.php?u=${this.shareLink}`,
        icon: 'fab fa-facebook-f'
      },
      {
        name: 'copy',
        color: '',
        href: this.shareLink || '',
        icon: 'fas fa-copy'
      },
      {
        name: 'linkedin',
        color: '#0A66C2',
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${this.shareLink}`,
        icon: 'fab fa-linkedin-in'
      },
      {
        name: 'whatsapp',
        color: '#25D366',
        href: `https://wa.me/?text=${this.shareLink}`,
        icon: 'fab fa-whatsapp'
      },
      {
        name: 'twitter',
        color: '#1DA1F2',
        href: `https://twitter.com/share?url=${this.shareLink}`,
        icon: 'fab fa-twitter'
      },
      {
        name: 'mail',
        color: 'black',
        href: `mailto:?body=${this.shareLink}`,
        icon: 'far fa-envelope'
      }]
    },
    platformsToShow (): SocialMedia[] {
      if (!this.shareLink) {
        return []
      }
      const platformsToReturn: SocialMedia[] = []
      this.platforms.forEach((platform) => {
        const foundPlatform = this.platformDefinitions.find(platformDefinition => platformDefinition.name === platform)
        if (foundPlatform) {
          platformsToReturn.push(foundPlatform)
        }
      })
      return platformsToReturn
    }
  },
  methods: {
    async copyLink (platform: SocialMedia): Promise<void> {
      if (platform.name !== 'copy') {
        return
      }
      try {
        await navigator.clipboard.writeText(platform.href)
        this.$nuxt.$emit('alert', {
          title: 'Link in Zwischenablage.',
          type: 'success'
        })
      } catch (e) {
        this.$nuxt.$emit('alert', {
          title: `Unerwarteter Fehler aufgetreten: ${e}`,
          type: 'error'
        })
      }
    }
  }
})
</script>
