import {gql} from 'graphql-tag'
import Vue from 'vue'
import Service from '~/sdk/wep/services/Service'
import Subscription from '~/sdk/wep/models/subscription/Subscription'
import Subscriptions from '~/sdk/wep/models/subscription/Subscriptions'
import PaymentResponse from '~/sdk/wep/models/response/PaymentResponse'

export default class SubscriptionService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  /**
   * Fetch users subscription from api.
   */
  async getSubscriptions(): Promise<Subscriptions | false> {
    try {
      const query = gql`
        query getSubscriptions {
          subscriptions {
            ...subscription
          }
        }
        ${Subscription.subscriptionFragment}
      `
      const response = await this.$apollo.query({
        query,
        fetchPolicy: 'no-cache'
      })
      return new Subscriptions().parse(response.data.subscriptions)
    } catch (error) {
      this.$nuxt.$emit('alert', {
        title: 'Abos konnten nicht abgerufen werden.',
        type: 'error'
      })
      return false
    }
  }

  /**
   * Extend an existing subscription
   * @param subscriptionId
   * @param successURL
   * @param failureURL
   */
  async extendSubscription({
    subscriptionId,
    successURL,
    failureURL
  }: {
    subscriptionId: string
    successURL: string
    failureURL: string
  }): Promise<false | PaymentResponse> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation ExtendSubscription(
          $failureUrl: String
          $subscriptionId: ID!
          $successUrl: String
        ) {
          extendSubscription(
            failureURL: $failureUrl
            subscriptionId: $subscriptionId
            successURL: $successUrl
          ) {
            ...paymentResponse
          }
        }
        ${PaymentResponse.paymentResponse}
      `

      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          subscriptionId,
          successURL,
          failureURL
        }
      })

      this.loadingFinish()
      return new PaymentResponse(response?.data?.extendSubscription)
    } catch (e) {
      this.alert({
        title: 'Beim Verlängern des Abos ist ein Fehler aufgetreten.',
        type: 'error'
      })
      this.loadingFinish()
      return false
    }
  }

  /**
   * Cancel my subscription
   * @return {Promise<boolean|Subscription>}
   */
  async cancelUserSubscription({
    subscriptionId
  }: {
    subscriptionId: string
  }): Promise<false | Subscription> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation Mutation($cancelUserSubscriptionId: ID!) {
          cancelUserSubscription(id: $cancelUserSubscriptionId) {
            ...subscription
          }
        }
        ${Subscription.subscriptionFragment}
      `

      const response = await this.$apollo.mutate({
        mutation,
        variables: {
          cancelUserSubscriptionId: subscriptionId
        }
      })
      this.loadingFinish()
      this.alert({
        title: 'Abo wurde erfolgreich gekündet.',
        type: 'success'
      })
      return new Subscription(response?.data?.cancelUserSubscription)
    } catch (e) {
      this.alert({
        title: 'Abo konnte nicht gekündet werden.',
        type: 'error'
      })
      this.loadingFinish()
      return false
    }
  }
}
