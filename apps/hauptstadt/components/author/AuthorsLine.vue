<template>
  <v-row v-if="authors">
    <v-col class="col-12 zoomable-text" :class="htmlClass">
      <span v-if="authors.authors.length">
        Von <span
          v-for="(author, authorIndex) in authors.authors"
          :key="authorIndex"
        >
          {{ author.name }}<span v-if="authors.authors.length === 2 && authorIndex === 0"> und</span><span v-else-if="authorIndex < (authors.authors.length - 1)">,</span><span v-if="authors.authors.length - 1 === authorIndex && date"><span v-if="peer">&nbsp;(<a :href="peer.profile ? peer.profile.websiteURL : ''" target="_blank" class="black--text">{{ peer.name }}</a>)</span>,</span>
        </span>
      </span>
      <!-- date -->
      <span v-if="date">{{ moment(date).locale('de').format('DD. MMMM YYYY') }}</span>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import moment, { Moment } from 'moment'
import Authors from '~/sdk/wep/models/author/Authors'
import Peer from '~/sdk/wep/models/peer/Peer'

export default Vue.extend({
  name: 'AuthorsLine',
  props: {
    authors: {
      type: Object as PropType<Authors>,
      required: true
    },
    date: {
      type: Object as PropType<Moment>,
      required: true
    },
    peer: {
      type: Object as PropType<Peer | undefined>,
      required: false,
      default: undefined
    },
    htmlClass: {
      type: String as PropType<string>,
      required: false,
      default: 'caption-3'
    }
  },
  data () {
    return {
      moment
    }
  }
})
</script>
