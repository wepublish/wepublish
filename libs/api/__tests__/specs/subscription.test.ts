import {ApolloServer} from 'apollo-server-express'
import {createGraphQLTestClientWithPrisma} from '../utility'
import {CreateSubscription, RenewSubscription, SubscriptionInput} from '../api/private'
import {
  Invoice,
  MemberPlan,
  PaymentMethod,
  PrismaClient,
  Subscription,
  SubscriptionPeriod,
  User
} from '@prisma/client'
import {
  PaymentPeriodicity,
  RegisterMemberAndReceivePayment,
  RegisterMemberAndReceivePaymentMutationVariables
} from '../api/public'
import {
  AlgebraicCaptchaChallenge,
  TestingChallengeAnswer
} from '../../src/lib/challenges/algebraicCaptchaChallenge'

let testServerPrivate: ApolloServer
let testServerPublic: ApolloServer
let prisma: PrismaClient
let challenge: AlgebraicCaptchaChallenge

let paymentMethod: PaymentMethod | undefined
let memberPlan: MemberPlan | undefined
let user: User | undefined
let subscription: Subscription | undefined
let invoice: Invoice | undefined
let subsccriptionPeriod: SubscriptionPeriod | undefined
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

    memberPlan = await prisma.memberPlan.create({
      data: {
        active: true,
        name: 'Member Plan Name',
        description: 'member plan description',
        id: 'memberplan-id',
        slug: 'memberplan-slug',
        extendable: true,
        maxCount: null,
        amountPerMonthMin: 100,
        availablePaymentMethods: {
          create: {
            forceAutoRenewal: false,
            paymentMethodIDs: [paymentMethod.id],
            paymentPeriodicities: ['biannual', 'monthly', 'quarterly', 'yearly']
          }
        }
      }
    })

    user = await prisma.user.create({
      data: {
        id: 'user-id',
        active: true,
        email: 'subscription-user@wepublish.dev',
        name: 'Tester',
        password: '1234'
      }
    })

    subscription = await prisma.subscription.create({
      data: {
        paymentPeriodicity: 'yearly',
        monthlyAmount: 2,
        autoRenew: true,
        startsAt: new Date(),
        paymentMethod: {connect: paymentMethod},
        memberPlan: {connect: {slug: memberPlan.slug}},
        user: {connect: {id: user.id}}
      }
    })

    invoice = await prisma.invoice.create({
      data: {
        mail: user.email,
        dueAt: new Date(),
        scheduledDeactivationAt: new Date()
      }
    })

    subsccriptionPeriod = await prisma.subscriptionPeriod.create({
      data: {
        startsAt: new Date(),
        endsAt: new Date(),
        paymentPeriodicity: 'yearly',
        amount: 24,
        invoice: {connect: {id: invoice.id}}
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
    test('can be created', async () => {
      const publicSubscription: RegisterMemberAndReceivePaymentMutationVariables = {
        autoRenew: false,
        monthlyAmount: 100,
        paymentPeriodicity: PaymentPeriodicity.Monthly,
        email: 'public-subscription-user@wepublish.dev',
        name: 'Public Subscription User',
        memberPlanId: memberPlan.id,
        paymentMethodId: paymentMethod.id,
        challengeAnswer: {
          ...testingChallengeResponse
        }
      }

      const result = await testServerPublic.executeOperation({
        query: RegisterMemberAndReceivePayment,
        variables: {
          ...publicSubscription
        }
      })

      const subscription = result.data.registerMemberAndReceivePayment

      const payment = await prisma.payment.findFirstOrThrow({
        where: {
          id: subscription.payment.id
        }
      })

      const invoice = await prisma.invoice.findFirstOrThrow({
        where: {
          id: payment.invoiceID
        }
      })

      // expects a session
      expect(subscription.session.token).toBeTruthy()

      // expects a payment
      expect(subscription.payment.id).toBeTruthy()

      // expects a user
      expect(subscription.user.id).toBeTruthy()

      // expects an invoice
      expect(invoice.id).toBeTruthy()
    })
  })

  describe('PRIVATE', () => {
    test('can be created', async () => {
      const subscriptionInput: SubscriptionInput = {
        autoRenew: true,
        extendable: true,
        monthlyAmount: 100,
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
            ...subscriptionInput
          }
        }
      })

      const subscription = result.data.createSubscription

      const invoice = await prisma.invoice.findFirst({
        where: {
          subscription: {
            id: {
              equals: subscription.id
            }
          }
        }
      })

      expect(subscription.id).toBeTruthy()
      expect(subscription.autoRenew).toBe(subscriptionInput.autoRenew)
      expect(subscription.paidUntil).toBeNull()
      expect(subscription.user.id).toBe(user.id)
      expect(subscription.monthlyAmount).toBe(subscriptionInput.monthlyAmount)
      expect(subscription.memberPlan.id).toBe(memberPlan.id)
      expect(subscription.extendable).toBe(subscriptionInput.extendable)
      expect(subscription.paymentMethod.id).toBe(paymentMethod.id)

      // expects an invoice
      expect(invoice.id).toBeTruthy()
    })

    test('does not renew unpaid subscriptions', async () => {
      const invoiceCountBefore = await prisma.invoice.count({where: {subscription}})
      const perdiodCountBefore = await prisma.subscriptionPeriod.count({where: {subscription}})

      await testServerPrivate.executeOperation({
        query: RenewSubscription,
        variables: {
          input: {
            id: subscription.id
          }
        }
      })

      const invoiceCountAfter = await prisma.invoice.count({where: {subscription}})
      const perdiodCountAfter = await prisma.subscriptionPeriod.count({where: {subscription}})

      expect(invoiceCountAfter).toEqual(invoiceCountBefore)
      expect(perdiodCountBefore).toEqual(perdiodCountAfter)
    })

    test('renews paid subscriptions', async () => {
      await prisma.invoice.update({
        where: {id: invoice.id},
        data: {
          paidAt: new Date()
        }
      })

      const invoiceCountBefore = await prisma.invoice.count({where: {subscription}})
      const perdiodCountBefore = await prisma.subscriptionPeriod.count({where: {subscription}})

      await testServerPrivate.executeOperation({
        query: RenewSubscription,
        variables: {
          input: {
            id: subscription.id
          }
        }
      })

      const invoiceCountAfter = await prisma.invoice.count({where: {subscription}})
      const perdiodCountAfter = await prisma.subscriptionPeriod.count({where: {subscription}})

      expect(invoiceCountAfter).toEqual(invoiceCountBefore)
      expect(perdiodCountBefore).toEqual(perdiodCountAfter)
    })
  })
})
