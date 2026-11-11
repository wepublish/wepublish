import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from '@wepublish/payment/api';
import type { Mock } from 'vitest';
import { PeriodicitySwitchService } from './periodicity-switch.service';
import { MemberContextService } from '../legacy/member-context.service';

vi.mock('../legacy/member-context.service');
vi.mock('@wepublish/payment/api');

const { monthly, quarterly, yearly } = PaymentPeriodicity;

const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub-1',
  userID: 'user-1',
  paymentPeriodicity: monthly,
  monthlyAmount: 1000,
  autoRenew: true,
  extendable: true,
  paidUntil: new Date('2025-01-20'),
  paymentMethodID: 'card',
  deactivation: null,
  paymentMethodChanges: [],
  paymentMethod: { id: 'card', paymentProviderID: 'stripe' },
  memberPlan: {
    id: 'plan-1',
    periodicityPricing: [{ periodicity: monthly, amountMin: 1000 }],
    availablePaymentMethods: [
      {
        paymentMethodIDs: ['card'],
        paymentPeriodicities: [monthly, quarterly, yearly],
        forceAutoRenewal: false,
      },
    ],
  },
  ...overrides,
});

describe('PeriodicitySwitchService', () => {
  let service: PeriodicitySwitchService;
  let prismaMock: {
    subscription: { findUnique: Mock; update: Mock };
  };
  let memberContextMock: { handleSubscriptionChange: Mock };
  let paymentsMock: { getProviders: Mock };

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      subscription: {
        findUnique: vi.fn(),
        update: vi.fn(async ({ data }) => ({ id: 'sub-1', ...data })),
      },
    };
    memberContextMock = {
      handleSubscriptionChange: vi.fn(async ({ subscription }) => subscription),
    };
    paymentsMock = {
      getProviders: vi.fn(() => [
        { id: 'stripe', remoteManagedSubscription: false },
        { id: 'payrexx-subscription', remoteManagedSubscription: true },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PeriodicitySwitchService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: MemberContextService, useValue: memberContextMock },
        { provide: PaymentsService, useValue: paymentsMock },
      ],
    }).compile();

    service = module.get(PeriodicitySwitchService);
  });

  describe('switchablePeriodicities', () => {
    it('offers the other periodicities of the current payment method', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(subscription());

      expect(await service.switchablePeriodicities('sub-1')).toEqual([
        quarterly,
        yearly,
      ]);
    });

    it('ignores periodicities only offered with other payment methods', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        subscription({
          memberPlan: {
            ...subscription().memberPlan,
            availablePaymentMethods: [
              {
                paymentMethodIDs: ['card'],
                paymentPeriodicities: [monthly],
                forceAutoRenewal: false,
              },
              {
                paymentMethodIDs: ['invoice'],
                paymentPeriodicities: [yearly],
                forceAutoRenewal: false,
              },
            ],
          },
        })
      );

      expect(await service.switchablePeriodicities('sub-1')).toEqual([]);
    });

    it('ignores configurations that force auto renewal when it is off', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        subscription({
          autoRenew: false,
          memberPlan: {
            ...subscription().memberPlan,
            availablePaymentMethods: [
              {
                paymentMethodIDs: ['card'],
                paymentPeriodicities: [monthly, yearly],
                forceAutoRenewal: true,
              },
            ],
          },
        })
      );

      expect(await service.switchablePeriodicities('sub-1')).toEqual([]);
    });

    it.each([
      ['it is cancelled', { deactivation: { date: new Date('2025-01-20') } }],
      ['it is not extendable', { extendable: false }],
      ['it is not paid', { paidUntil: null }],
      ['its paid period is over', { paidUntil: new Date('2024-12-31') }],
      ['its payment method is being changed', { paymentMethodChanges: [{}] }],
      [
        'the payment provider manages the subscription',
        {
          paymentMethod: {
            id: 'card',
            paymentProviderID: 'payrexx-subscription',
          },
        },
      ],
    ])('offers nothing when %s', async (_, overrides) => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        subscription(overrides)
      );

      expect(await service.switchablePeriodicities('sub-1')).toEqual([]);
    });

    it('offers nothing for an unknown subscription', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      expect(await service.switchablePeriodicities('sub-1')).toEqual([]);
    });
  });

  describe('switchPeriodicity', () => {
    it('changes the periodicity, records the change and lets the next renewal bill it', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(subscription());

      await service.switchPeriodicity({
        userId: 'user-1',
        subscriptionId: 'sub-1',
        paymentPeriodicity: yearly,
      });

      expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sub-1', userID: 'user-1' },
        })
      );
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: {
          paymentPeriodicity: yearly,
          monthlyAmount: 1000,
          periodicityChanges: {
            create: {
              fromPeriodicity: monthly,
              toPeriodicity: yearly,
              fromMonthlyAmount: 1000,
              toMonthlyAmount: 1000,
            },
          },
        },
        include: { deactivation: true, periods: true },
      });
      expect(memberContextMock.handleSubscriptionChange).toHaveBeenCalledWith({
        subscription: expect.objectContaining({ paymentPeriodicity: yearly }),
      });
    });

    it('raises the amount to the minimum of the new periodicity', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        subscription({
          memberPlan: {
            ...subscription().memberPlan,
            periodicityPricing: [
              { periodicity: monthly, amountMin: 1000 },
              { periodicity: yearly, amountMin: 15000 },
            ],
          },
        })
      );

      await service.switchPeriodicity({
        userId: 'user-1',
        subscriptionId: 'sub-1',
        paymentPeriodicity: yearly,
      });

      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            monthlyAmount: 1250,
            periodicityChanges: {
              create: expect.objectContaining({ toMonthlyAmount: 1250 }),
            },
          }),
        })
      );
    });

    it('keeps a higher amount the reader chose', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        subscription({ monthlyAmount: 2000 })
      );

      await service.switchPeriodicity({
        userId: 'user-1',
        subscriptionId: 'sub-1',
        paymentPeriodicity: yearly,
      });

      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ monthlyAmount: 2000 }),
        })
      );
    });

    it('rejects a subscription of another reader', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(
        service.switchPeriodicity({
          userId: 'user-2',
          subscriptionId: 'sub-1',
          paymentPeriodicity: yearly,
        })
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.subscription.update).not.toHaveBeenCalled();
    });

    it('rejects a periodicity the subscription can not switch to', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        subscription({ deactivation: { date: new Date('2025-01-20') } })
      );

      await expect(
        service.switchPeriodicity({
          userId: 'user-1',
          subscriptionId: 'sub-1',
          paymentPeriodicity: yearly,
        })
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.subscription.update).not.toHaveBeenCalled();
    });

    it('rejects the current periodicity', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(subscription());

      await expect(
        service.switchPeriodicity({
          userId: 'user-1',
          subscriptionId: 'sub-1',
          paymentPeriodicity: monthly,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });
});
