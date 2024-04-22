import {gql} from 'graphql-tag'
import Vue from 'vue'
import RegisterMemberAndReceivePaymentResponse from '~/sdk/wep/models/response/RegisterMemberAndReceivePaymentResponse'
import Service from '~/sdk/wep/services/Service'
import MemberRegistration from '~/sdk/wep/models/member/MemberRegistration'
import PaymentMethod from '~/sdk/wep/models/paymentMethod/PaymentMethod'
import User from '~/sdk/wep/models/user/User'
import PaymentResponse from '~/sdk/wep/models/response/PaymentResponse'
import RegisterMemberResponse from '~/sdk/wep/models/response/RegisterMemberResponse'

export default class MemberService extends Service {
  constructor({vue}: {vue: Vue}) {
    super({vue})
  }

  public async registerMember({
    memberRegistration
  }: {
    memberRegistration: MemberRegistration
  }): Promise<RegisterMemberResponse | false> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })

    // workaround for https://wepublish.atlassian.net/browse/WPC-811
    if (memberRegistration.address?.isEmpty()) {
      memberRegistration.address = undefined
    }

    try {
      const mutation = gql`
        mutation registerMember(
          $name: String!
          $email: String!
          $challengeAnswer: ChallengeInput!
          $firstName: String
          $preferredName: String
          $address: UserAddressInput
          $password: String
        ) {
          registerMember(
            name: $name
            email: $email
            challengeAnswer: $challengeAnswer
            firstName: $firstName
            preferredName: $preferredName
            address: $address
            password: $password
          ) {
            user {
              ...user
            }
            session {
              token
            }
          }
        }
        ${User.userFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: memberRegistration
      })
      // in case of errors
      const rawData = response?.data?.registerMember
      this.loadingFinish()
      if (rawData) {
        return new RegisterMemberResponse(rawData)
      }
      throw new Error('Keine Daten von der API erhalten.')
    } catch (error) {
      this.loadingFinish()
      if (JSON.stringify(error).includes('Email already in use')) {
        this.alert({
          title: 'Die angegebene Mailadresse ist bereits registriert, logge Dich bitte ein.',
          type: 'error'
        })
        const loginPath = this.vue.$nuxt.$config.LOGIN_PATH
        if (!loginPath && this.vue.$sentry) {
          this.vue.$sentry.captureException(new Error('LOGIN_PATH not set in memberService.ts'))
        }
        await this.vue.$router.push({
          path: loginPath,
          query: {
            mail: memberRegistration.email
          }
        })
      } else {
        this.alert({
          title: `Bei der Registration ist ein Fehler aufgetreten: ${error}`,
          type: 'error'
        })
      }
      return false
    }
  }

  /**
   * Create new member and generate invoice as well as a payment link
   * @param apollo
   * @param memberRegistration
   * @return {Promise<RegisterMemberAndReceivePaymentResponse|boolean>}
   */
  public async registerMemberAndReceivePayment({
    memberRegistration
  }: {
    memberRegistration: MemberRegistration
  }): Promise<RegisterMemberAndReceivePaymentResponse | false> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })

    // workaround for https://wepublish.atlassian.net/browse/WPC-811
    if (memberRegistration.address?.isEmpty()) {
      memberRegistration.address = undefined
    }

    try {
      const mutation = gql`
        mutation registerMemberAndReceivePayment(
          $name: String!
          $firstName: String
          $email: String!
          $memberPlanId: ID!
          $autoRenew: Boolean!
          $paymentPeriodicity: PaymentPeriodicity!
          $monthlyAmount: Int!
          $paymentMethodId: ID!
          $preferredName: String
          $address: UserAddressInput
          $successURL: String
          $failureURL: String
          $challengeAnswer: ChallengeInput!
        ) {
          registerMemberAndReceivePayment(
            name: $name
            firstName: $firstName
            email: $email
            memberPlanID: $memberPlanId
            autoRenew: $autoRenew
            paymentPeriodicity: $paymentPeriodicity
            monthlyAmount: $monthlyAmount
            paymentMethodID: $paymentMethodId
            preferredName: $preferredName
            address: $address
            successURL: $successURL
            failureURL: $failureURL
            challengeAnswer: $challengeAnswer
          ) {
            payment {
              intentSecret
              id
              state
              paymentMethod {
                ...paymentMethod
              }
            }
            user {
              ...user
            }
            session {
              token
            }
          }
        }
        ${PaymentMethod.paymentMethodFragment}
        ${User.userFragment}
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: memberRegistration
      })
      // in case of errors
      const rawData = response?.data?.registerMemberAndReceivePayment
      this.loadingFinish()
      if (rawData) {
        return new RegisterMemberAndReceivePaymentResponse(rawData)
      }
      throw new Error('Keine Daten von der API erhalten.')
    } catch (error) {
      this.loadingFinish()
      if (JSON.stringify(error).includes('Email already in use')) {
        this.alert({
          title: 'Die angegebene Mailadresse ist bereits registriert, logge Dich bitte ein.',
          type: 'error'
        })
        const loginPath = this.vue.$nuxt.$config.LOGIN_PATH
        if (!loginPath && this.vue.$sentry) {
          this.vue.$sentry.captureException(new Error('LOGIN_PATH not set in memberService.ts'))
        }
        await this.vue.$router.push({
          path: loginPath,
          query: {
            mail: memberRegistration.email
          }
        })
      } else {
        this.alert({
          title: `Bei der Registration ist ein Fehler aufgetreten: ${error}`,
          type: 'error'
        })
      }
      return false
    }
  }

  /**
   * Create a subscription as logged-in user
   * @param apollo
   * @param memberRegistration
   * @return {Promise<RegisterMemberAndReceivePaymentResponse|boolean>}
   */
  public async createSubscription({
    memberRegistration
  }: {
    memberRegistration: MemberRegistration
  }): Promise<PaymentResponse | false> {
    this.vue.$nextTick(() => {
      this.loadingStart()
    })
    try {
      const mutation = gql`
        mutation CreateSubscription(
          $autoRenew: Boolean!
          $paymentPeriodicity: PaymentPeriodicity!
          $monthlyAmount: Int!
          $memberPlanId: ID
          $paymentMethodId: ID
          $successURL: String
          $failureURL: String
        ) {
          createSubscription(
            autoRenew: $autoRenew
            paymentPeriodicity: $paymentPeriodicity
            monthlyAmount: $monthlyAmount
            memberPlanID: $memberPlanId
            paymentMethodID: $paymentMethodId
            successURL: $successURL
            failureURL: $failureURL
          ) {
            id
            intentSecret
            state
            paymentMethod {
              id
              paymentProviderID
              name
              description
            }
          }
        }
      `
      const response = await this.$apollo.mutate({
        mutation,
        variables: memberRegistration
      })
      // in case of errors
      const rawData = response?.data?.createSubscription
      this.loadingFinish()
      if (rawData) {
        return new PaymentResponse(rawData)
      }
      return false
    } catch (error) {
      this.loadingFinish()
      this.alert({
        title: `Beim Lösen des Abos ist ein Fehler aufgetreten: ${error}`,
        type: 'error'
      })
      return false
    }
  }
}
