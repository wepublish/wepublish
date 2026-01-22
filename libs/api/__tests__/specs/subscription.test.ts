import { ApolloServer } from 'apollo-server-express';
import { createGraphQLTestClientWithPrisma } from '../utility';
import { RenewSubscription } from '../api/private';
import {
  Currency,
  Invoice,
  MemberPlan,
  PaymentMethod,
  PrismaClient,
  Subscription,
  User,
} from '@prisma/client';

let testServerPrivate: ApolloServer;
let prisma: PrismaClient;

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
