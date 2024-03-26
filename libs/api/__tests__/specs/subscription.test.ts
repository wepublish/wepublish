import {ApolloServer} from 'apollo-server-express'
import {createGraphQLTestClientWithPrisma} from '../utility'
import {CreateSubscription, SubscriptionInput} from '../api/private'
import {MemberPlan, PaymentMethod, PrismaClient, User} from '@prisma/client'
import {
  PaymentPeriodicity,
  RegisterMemberAndReceivePayment,
  RegisterMemberAndReceivePaymentMutationVariables
} from '../api/public'
import {AlgebraicCaptchaChallenge, TestingChallengeAnswer} from '@wepublish/api'

let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer
let prisma: PrismaClient
let challenge: AlgebraicCaptchaChallenge

let paymentMethod: PaymentMethod | undefined
let trialMemberPlan: MemberPlan | undefined
let normalMemberPlan: MemberPlan | undefined
let user: User | undefined
let testingChallengeResponse: TestingChallengeAnswer | undefined

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
    testServerPublic = setupClient.testServerPublic

    prisma = setupClient.prisma
    challenge = setupClient.challenge

    // prepare mock data
    paymentMethod = await prisma.paymentMethod.create({
      data: {
        id: 'payment-method-id',
        active: true,
        createdAt: new Date(),
        name: 'Payment Method Name',
        slug: 'payment-method-slug',
        paymentProviderID: 'testing-payment-provider-id',
        description: 'payment method description'
      }
    })

    const baseMemberPlan = {
      active: true,
      name: 'Member Plan Name',
      description: 'member plan description'
    }

    trialMemberPlan = await prisma.memberPlan.create({
      data: {
        ...baseMemberPlan,
        id: 'trial-memberplan-id',
        slug: 'trial-memberplan-slug',
        extendable: false,
        maxCount: 1,
        amountPerMonthMin: 0,
        availablePaymentMethods: {
          create: {
            forceAutoRenewal: false,
            paymentMethodIDs: [paymentMethod.id],
            paymentPeriodicities: ['biannual', 'monthly', 'quarterly', 'yearly']
          }
        }
      }
    })

    normalMemberPlan = await prisma.memberPlan.create({
      data: {
        ...baseMemberPlan,
        id: 'normal-memberplan-id',
        slug: 'normal-memberplan-slug',
        extendable: true,
        maxCount: null,
        amountPerMonthMin: 1
      }
    })

    user = await prisma.user.create({
      data: {
        id: 'user-id',
        active: true,
        email: 'trial-subscription-user@wepublish.dev',
        name: 'Tester',
        password: '1234'
      }
    })

    await challenge.generateChallenge(true)
    testingChallengeResponse = challenge.getTestingChallengeAnswer()
  } catch (error) {
    console.log('Error', error)
    throw new Error(error.toString())
  }
})

describe('Subscriptions', () => {
  describe('PUBLIC', () => {
    test('invoice of free subscription is marked as paid', async () => {
      const publicTrialSubscription: RegisterMemberAndReceivePaymentMutationVariables = {
        autoRenew: false,
        monthlyAmount: 0,
        paymentPeriodicity: PaymentPeriodicity.Monthly,
        email: 'public-trial-subscription-user@wepublish.dev',
        name: 'Public Trial Subscription User',
        memberPlanId: trialMemberPlan.id,
        paymentMethodId: paymentMethod.id,
        challengeAnswer: {
          ...testingChallengeResponse
        }
      }

      const result = await testServerPublic.executeOperation({
        query: RegisterMemberAndReceivePayment,
        variables: {
          ...publicTrialSubscription
        }
      })

      const createdTrialSubscription = result.data.registerMemberAndReceivePayment

      const payment = await prisma.payment.findFirstOrThrow({
        where: {
          id: createdTrialSubscription.payment.id
        }
      })

      const invoice = await prisma.invoice.findFirstOrThrow({
        where: {
          id: payment.invoiceID
        }
      })

      // expect a trial subscription's invoice to be paid at not null
      expect(invoice.paidAt).not.toBe(null)
    })

    // todo
    test('invoice of normal subscription remains unpaid', async () => {})

    test('invoice of free subscription is marked as paid with logged-in user', async () => {})

    // todo
    test('invoice of normal subscription remains unpaid with logged-in user', async () => {})
  })

  describe('PRIVATE', () => {
    test('invoice of free subscription is marked as paid.', async () => {
      const trialSubscription: SubscriptionInput = {
        autoRenew: false,
        extendable: false,
        monthlyAmount: 0,
        userID: user.id,
        paymentMethodID: paymentMethod.id,
        paymentPeriodicity: PaymentPeriodicity.Monthly,
        memberPlanID: trialMemberPlan.id,
        properties: [],
        startsAt: new Date().toISOString()
      }

      const result = await testServerPrivate.executeOperation({
        query: CreateSubscription,
        variables: {
          input: {
            ...trialSubscription
          }
        }
      })

      const createdTrialSubscription = result.data.createSubscription

      const invoice = await prisma.invoice.findFirst({
        where: {
          subscription: {
            id: {
              equals: createdTrialSubscription.id
            }
          }
        }
      })

      // expect a trial subscription's invoice to be paid at not null
      expect(invoice.paidAt).not.toBe(null)
    })

    test('invoice of normal subscription remains unpaid', async () => {
      const normalSubscription: SubscriptionInput = {
        autoRenew: true,
        extendable: true,
        monthlyAmount: 1,
        userID: user.id,
        paymentMethodID: paymentMethod.id,
        paymentPeriodicity: PaymentPeriodicity.Monthly,
        memberPlanID: normalMemberPlan.id,
        properties: [],
        startsAt: new Date().toISOString()
      }

      const result = await testServerPrivate.executeOperation({
        query: CreateSubscription,
        variables: {
          input: {
            ...normalSubscription
          }
        }
      })
      const createdNormalSubscription = result.data.createSubscription

      const invoice = await prisma.invoice.findFirst({
        where: {
          subscription: {
            id: {
              equals: createdNormalSubscription.id
            }
          }
        }
      })

      // invoice should be not paid
      expect(invoice.paidAt).toBe(null)
    })
  })
})
