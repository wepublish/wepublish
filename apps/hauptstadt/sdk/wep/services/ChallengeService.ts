import Vue from 'vue'
import {gql} from 'graphql-tag'
import Service from '~/sdk/wep/services/Service'
import Challenge from '~/sdk/wep/models/challenge/Challenge'

export default class ChallengeService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  async getChallenge(): Promise<Challenge | false> {
    try {
      const query = gql`
        query getChallenge {
          challenge {
            ...challenge
          }
        }
        ${Challenge.challengeFragment}
      `
      const response = await this.$apollo.query({
        query,
        fetchPolicy: 'no-cache'
      })
      return new Challenge(response.data.challenge)
    } catch (e) {
      this.$nuxt.$emit('alert', {
        title: 'Challenge konnte nicht abgerufen werden.',
        type: 'error'
      })
      return false
    }
  }
}
