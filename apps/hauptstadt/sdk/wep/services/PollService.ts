import Vue from 'vue'
import {gql} from 'graphql-tag'
import Service from '~/sdk/wep/services/Service'

export default class PollService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  public async voteOnPoll({answerId}: {answerId: string}): Promise<boolean> {
    if (!answerId) {
      throw new Error('answerId missing in voteOnPoll() method within PollService class!')
    }
    this.vue.$nextTick(() => {
      this.loadingStart()
    })

    try {
      const mutation = gql`
        mutation voteOnPoll($answerId: ID!) {
          voteOnPoll(answerId: $answerId) {
            fingerprint
            disabled
            createdAt
          }
        }
      `
      await this.$apollo.mutate({
        mutation,
        variables: {
          answerId
        }
      })
      this.loadingFinish()
      return true
    } catch (e) {
      this.loadingFinish()
      this.alert({
        title: 'Leider hat das Abstimmen nicht funktioniert.',
        type: 'error'
      })
      return false
    }
  }
}
