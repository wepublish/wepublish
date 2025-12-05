import { ApolloServer } from 'apollo-server-express';
import { createGraphQLTestClientWithPrisma } from '../utility';
import {
  CreateSubscription,
  RenewSubscription,
  SubscriptionInput,
} from '../api/private';
import {
  Currency,
  Invoice,
  MemberPlan,
  PaymentMethod,
  PrismaClient,
  Subscription,
  User,
} from '@prisma/client';
import { PaymentPeriodicity } from '../api/public';
import { AlgebraicCaptchaChallenge } from '../../src/lib/challenges/algebraicCaptchaChallenge';

let testServerPrivate: ApolloServer;
let prisma: PrismaClient;
let challenge: AlgebraicCaptchaChallenge;

let paymentMethod: PaymentMethod | undefined;
let memberPlan: MemberPlan | undefined;
let user: User | undefined;
let subscription: Subscription | undefined;
let invoice: Invoice | undefined;

beforeAll(async () => {
  try {
    const setupClient = await createGraphQLTestClientWithPrisma();
    testServerPrivate = setupClient.testServerPrivate;

    prisma = setupClient.prisma;
    challenge = setupClient.challenge;

    // prepare mock data
    paymentMethod = await prisma.paymentMethod.create({
      data: {
        id: 'payment-method-id',
        active: true,
        createdAt: new Date(),
        name: 'Payment Method Name',
        slug: 'payment-method-slug',
        paymentProviderID: 'testing-payment-provider-id',
        description: 'payment method description',
      },
    });

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
            paymentPeriodicities: [
              'biannual',
              'monthly',
              'quarterly',
              'yearly',
              'biennial',
              'lifetime',
            ],
          },
        },
        currency: Currency.CHF,
      },
    });

    user = await prisma.user.create({
      data: {
        id: 'user-id',
        active: true,
        email: 'subscription-user@wepublish.dev',
        name: 'Tester',
        password: '1234',
      },
    });

    subscription = await prisma.subscription.create({
      data: {
        paymentPeriodicity: 'yearly',
        monthlyAmount: 2,
        autoRenew: true,
        startsAt: new Date(),
        currency: Currency.CHF,
        paymentMethod: { connect: paymentMethod },
        memberPlan: { connect: { slug: memberPlan.slug } },
        user: { connect: { id: user.id } },
      },
    });

    invoice = await prisma.invoice.create({
      data: {
        mail: user.email,
        dueAt: new Date(),
        currency: Currency.CHF,
        scheduledDeactivationAt: new Date(),
      },
    });
  } catch (error) {
    console.log('Error', error);
    throw new Error(error.toString());
  }
});

describe('Subscriptions', () => {
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
        startsAt: new Date().toISOString(),
      };

      const result = await testServerPrivate.executeOperation({
        query: CreateSubscription,
        variables: {
          input: {
            ...subscriptionInput,
          },
        },
      });

      const subscription = result.data.createSubscription;

      const invoice = await prisma.invoice.findFirst({
        where: {
          subscription: {
            id: {
              equals: subscription.id,
            },
          },
        },
      });

      expect(subscription.id).toBeTruthy();
      expect(subscription.autoRenew).toBe(subscriptionInput.autoRenew);
      expect(subscription.paidUntil).toBeNull();
      expect(subscription.user.id).toBe(user.id);
      expect(subscription.monthlyAmount).toBe(subscriptionInput.monthlyAmount);
      expect(subscription.memberPlan.id).toBe(memberPlan.id);
      expect(subscription.extendable).toBe(subscriptionInput.extendable);
      expect(subscription.paymentMethod.id).toBe(paymentMethod.id);

      // expects an invoice
      expect(invoice.id).toBeTruthy();
    });

    test('does not renew unpaid subscriptions', async () => {
      const invoiceCountBefore = await prisma.invoice.count({
        where: { subscription },
      });
      const perdiodCountBefore = await prisma.subscriptionPeriod.count({
        where: { subscription },
      });

      await testServerPrivate.executeOperation({
        query: RenewSubscription,
        variables: {
          input: {
            id: subscription.id,
          },
        },
      });

      const invoiceCountAfter = await prisma.invoice.count({
        where: { subscription },
      });
      const perdiodCountAfter = await prisma.subscriptionPeriod.count({
        where: { subscription },
      });

      expect(invoiceCountAfter).toEqual(invoiceCountBefore);
      expect(perdiodCountBefore).toEqual(perdiodCountAfter);
    });

    test('renews paid subscriptions', async () => {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAt: new Date(),
        },
      });

      const invoiceCountBefore = await prisma.invoice.count({
        where: { subscription },
      });
      const perdiodCountBefore = await prisma.subscriptionPeriod.count({
        where: { subscription },
      });

      await testServerPrivate.executeOperation({
        query: RenewSubscription,
        variables: {
          input: {
            id: subscription.id,
          },
        },
      });

      const invoiceCountAfter = await prisma.invoice.count({
        where: { subscription },
      });
      const perdiodCountAfter = await prisma.subscriptionPeriod.count({
        where: { subscription },
      });

      expect(invoiceCountAfter).toEqual(invoiceCountBefore);
      expect(perdiodCountBefore).toEqual(perdiodCountAfter);
    });
  });
});
