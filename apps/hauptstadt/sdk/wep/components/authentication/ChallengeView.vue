<template>
  <v-row
    v-if="challenge"
    class="align-center"
  >
    <v-col
      class="col-7 col-sm-auto pt-0 pr-0"
      v-html="challenge.challenge"
    />
    <v-col class="col-5 pl-0">
      <v-text-field
        :value="challengeAnswer.challengeSolution"
        outlined
        :rounded="rounded"
        label="Antwort"
        class="mt-6"
        :rules="[v => !!v || 'Bitte gib das Resultat aus der Rechnungsaufgabe ein.']"
        @input="setChallengeSolution"
        @keyup.enter="$emit('enter')"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'
import Challenge from '~/sdk/wep/models/challenge/Challenge'
import ChallengeService from '~/sdk/wep/services/ChallengeService'
import ChallengeAnswer from '~/sdk/wep/models/challenge/ChallengeAnswer'

export default Vue.extend({
  name: 'ChallengeView',
  props: {
    challenge: {
      type: Object as PropType<undefined | Challenge>,
      required: false,
      default: undefined
    },
    challengeAnswer: {
      type: Object as PropType<ChallengeAnswer>,
      required: true,
      default: undefined
    },
    rounded: {
      type: Boolean as PropType<boolean>,
      required: false,
      default: false
    }
  },
  fetchOnServer: false,
  async fetch () {
    const challengeService = new ChallengeService({ vue: this })
    const challenge = await challengeService.getChallenge()
    if (challenge) {
      this.$emit('update:challenge', challenge)
    }
  },
  methods: {
    setChallengeSolution (answer: string) {
      if (!this.challenge) {
        return
      }
      const challengeAnswer = new ChallengeAnswer({
        challengeID: this.challenge.challengeID,
        challengeSolution: answer
      })
      this.$emit('update:challengeAnswer', challengeAnswer)
    },
    fetch () {
      this.$fetch()
    }
  }
})
</script>
