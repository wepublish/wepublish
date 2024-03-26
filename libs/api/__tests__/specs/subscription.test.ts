import {ApolloServer} from 'apollo-server-express'
import {createGraphQLTestClientWithPrisma} from '../utility'
import {CreateSubscription, PaymentPeriodicity, SubscriptionInput} from '../api/private'
import {MemberPlan, PaymentMethod, PrismaClient, User} from '@prisma/client'
import {PaymentProvider} from '@wepublish/payment/api'

let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer
let prisma: PrismaClient

let paymentMethod: PaymentMethod | undefined
let memberPlan: MemberPlan | undefined
let user: User | undefined

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma()
    testServerPrivate = setupClient.testServerPrivate
    testServerPublic = setupClient.testServerPublic

    prisma = setupClient.prisma

    // prepare mock data
    paymentMethod = await prisma.paymentMethod.create({
      data: {
        id: 'payment-method-id',
        active: true,
        createdAt: new Date(),
        name: 'Payment Method Name',
        slug: 'payment-method-slug',
        paymentProviderID: 'payment-provider',
        description: 'payment method description'
      }
    })

    memberPlan = await prisma.memberPlan.create({
      data: {
        id: 'memberplan-id',
        active: true,
        amountPerMonthMin: 0,
        extendable: false,
        maxCount: 1,
        name: 'Member Plan Name',
        slug: 'memberplan-slug',
        description: 'member plan description'
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
  } catch (error) {
    console.log('Error', error)
    throw new Error('Error during test setup')
  }
})

describe('Subscriptions', () => {
  describe('PRIVATE', () => {
    test('invoice of trial subscription is marked as paid.', async () => {
      const trialSubscription: SubscriptionInput = {
        autoRenew: false,
        extendable: false,
        monthlyAmount: 0,
        userID: user.id,
        paymentMethodID: paymentMethod.id,
        paymentPeriodicity: PaymentPeriodicity.Monthly,
        memberPlanID: memberPlan.id,
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
  })
})
