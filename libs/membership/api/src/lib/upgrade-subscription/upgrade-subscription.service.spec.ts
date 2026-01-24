import { Test, TestingModule } from '@nestjs/testing';
import { Currency, PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { UpgradeSubscriptionService } from './upgrade-subscription.service';

import { MemberContextService } from '../legacy/member-context.service';
import { PaymentsService } from '@wepublish/payment/api';

jest.mock('../legacy/member-context.service');
jest.mock('@wepublish/payment/api');

describe('UpgradeSubscriptionService', () => {
  let service: UpgradeSubscriptionService;
  let prismaMock: {
    subscription: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    memberPlan: {
      findUnique: jest.Mock;
    };
  };
  let memberContextMock: {
    cancelInvoicesForSubscription: jest.Mock;
    cancelRemoteSubscription: jest.Mock;
    createSubscription: jest.Mock;
  };

  let paymentServiceMock: {
    createPaymentWithProvider: jest.Mock;
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeAll(async () => {
    prismaMock = {
      subscription: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      memberPlan: {
        findUnique: jest.fn(),
      },
    };
    memberContextMock = {
      cancelInvoicesForSubscription: jest.fn(),
      cancelRemoteSubscription: jest.fn(),
      createSubscription: jest.fn(),
    };
    paymentServiceMock = {
      createPaymentWithProvider: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpgradeSubscriptionService,
        {
          provide: MemberContextService,
          useValue: memberContextMock,
        },
        {
          provide: PaymentsService,
          useValue: paymentServiceMock,
        },
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UpgradeSubscriptionService>(
      UpgradeSubscriptionService
    );
  });

  describe('happy path', () => {
    it('should upgrade a subscription', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        id: 'subscriptionId',
        userID: 'userId',
        currency: Currency.CHF,
        paymentPeriodicity: PaymentPeriodicity.yearly,
        extendable: true,
        autoRenew: true,
        periods: [
          {
            id: '1',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 300,
            endsAt: new Date('2023-01-01'),
            createdAt: new Date('2022-01-01'),
            startsAt: new Date('2022-01-01'),
            invoice: {
              paidAt: new Date('2022-01-01'),
            },
          },
          {
            id: '2',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 400,
            endsAt: new Date('2024-01-01'),
            createdAt: new Date('2023-01-01'),
            startsAt: new Date('2023-01-01'),
            invoice: {
              paidAt: new Date('2023-01-01'),
            },
          },
          {
            id: '3',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 500,
            endsAt: new Date('2025-01-01'),
            createdAt: new Date('2024-01-01'),
            startsAt: new Date('2024-01-01'),
            invoice: {
              paidAt: new Date('2024-01-01'),
            },
          },
          {
            id: '4',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 600,
            endsAt: new Date('2026-01-01'),
            createdAt: new Date('2025-01-01'),
            startsAt: new Date('2025-01-01'),
            invoice: {
              paidAt: new Date('2025-01-01'),
            },
          },
          {
            id: '5',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 700,
            endsAt: new Date('2027-01-01'),
            createdAt: new Date('2026-01-01'),
            startsAt: new Date('2026-01-01'),
            invoice: {
              paidAt: null,
            },
          },
        ],
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({
        id: 'memberPlanId',
        currency: Currency.CHF,
        availablePaymentMethods: [
          {
            paymentMethodIDs: ['paymentMethodId'],
            paymentPeriodicities: [PaymentPeriodicity.yearly],
            forceAutoRenewal: true,
          },
        ],
      });
      memberContextMock.createSubscription.mockResolvedValue({
        invoice: {
          id: 'invoiceId',
        },
      });

      await service.upgradeSubscription({
        subscriptionId: 'subscriptionId',
        memberPlanId: 'memberPlanId',
        paymentMethodId: 'paymentMethodId',
        userId: 'userId',
        monthlyAmount: 80,
      });

      expect({
        cancelInvoicesForSubscription:
          memberContextMock.cancelInvoicesForSubscription.mock.calls[0],
        cancelRemoteSubscription:
          memberContextMock.cancelRemoteSubscription.mock.calls[0],
        createSubscription: memberContextMock.createSubscription.mock.calls[0],
        createPaymentWithProvider:
          paymentServiceMock.createPaymentWithProvider.mock.calls[0],
        subscriptionUpdate: prismaMock.subscription.update.mock.calls[0],
      }).toMatchSnapshot();
    });

    it('should calculate the correct discount', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userID: 'userId',
        currency: Currency.CHF,
        paymentPeriodicity: PaymentPeriodicity.yearly,
        extendable: true,
        autoRenew: true,
        periods: [
          {
            id: '1',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 300,
            endsAt: new Date('2023-01-01'),
            createdAt: new Date('2022-01-01'),
            startsAt: new Date('2022-01-01'),
            invoice: {
              paidAt: new Date('2022-01-01'),
            },
          },
          {
            id: '2',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 400,
            endsAt: new Date('2024-01-01'),
            createdAt: new Date('2023-01-01'),
            startsAt: new Date('2023-01-01'),
            invoice: {
              paidAt: new Date('2023-01-01'),
            },
          },
          {
            id: '3',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 500,
            endsAt: new Date('2025-01-01'),
            createdAt: new Date('2024-01-01'),
            startsAt: new Date('2024-01-01'),
            invoice: {
              paidAt: new Date('2024-01-01'),
            },
          },
          {
            id: '4',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 600,
            endsAt: new Date('2026-01-01'),
            createdAt: new Date('2025-01-01'),
            startsAt: new Date('2025-01-01'),
            invoice: {
              paidAt: new Date('2025-01-01'),
            },
          },
          {
            id: '5',
            paymentPeriodicity: PaymentPeriodicity.yearly,
            amount: 700,
            endsAt: new Date('2027-01-01'),
            createdAt: new Date('2026-01-01'),
            startsAt: new Date('2026-01-01'),
            invoice: {
              paidAt: null,
            },
          },
        ],
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({
        currency: Currency.CHF,
        availablePaymentMethods: [
          {
            paymentMethodIDs: ['paymentMethodId'],
            paymentPeriodicities: [PaymentPeriodicity.yearly],
            forceAutoRenewal: true,
          },
        ],
      });

      const result = await service.getInfo({
        subscriptionId: 'subscriptionId',
        memberPlanId: 'memberPlanId',
        userId: 'userId',
      });

      // Should not be 700 as the period with 700 is unpaid
      // Should not be 500 but 600 because the period with 500 got extended and paid already
      expect(result).toBe(600);
    });
  });

  describe('unhappy path', () => {
    it('should throw an error if the subscription can not be found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(null);

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();

      await expect(async () => {
        await service.getInfo({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          userId: 'userId',
        });
      }).rejects.toMatchSnapshot();
    });

    it('should throw an error if the subscription does not belong to the current user', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userId: 'notUserId',
      });

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();

      await expect(async () => {
        await service.getInfo({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          userId: 'userId',
        });
      }).rejects.toMatchSnapshot();
    });

    it('should throw an error if the memberplan can not be found', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userID: 'userId',
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue(null);

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();

      await expect(async () => {
        await service.getInfo({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          userId: 'userId',
        });
      }).rejects.toMatchSnapshot();
    });

    it("should throw an error if the subscription's memberplan is the same as the new one", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userID: 'userId',
        memberPlanID: 'memberPlanId',
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({});

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();

      await expect(async () => {
        await service.getInfo({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          userId: 'userId',
        });
      }).rejects.toMatchSnapshot();
    });

    it("should throw an error if the subscription's currency is not the same", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userID: 'userId',
        currency: Currency.EUR,
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({
        currency: Currency.CHF,
      });

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();

      await expect(async () => {
        await service.getInfo({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          userId: 'userId',
        });
      }).rejects.toMatchSnapshot();
    });

    it('should throw an error if the paymentMethodId is not allowed on the new memberplan', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userID: 'userId',
        currency: Currency.CHF,
        paymentPeriodicity: PaymentPeriodicity.yearly,
        extendable: true,
        autoRenew: true,
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({
        currency: Currency.CHF,
        availablePaymentMethods: [
          {
            paymentMethodIDs: ['notPaymentMethodId'],
            paymentPeriodicities: [PaymentPeriodicity.yearly],
          },
        ],
      });

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();
    });

    it("should throw an error if the subscription's periodicity is not the same", async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userID: 'userId',
        currency: Currency.CHF,
        paymentPeriodicity: PaymentPeriodicity.monthly,
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({
        currency: Currency.CHF,
        availablePaymentMethods: [
          {
            paymentMethodIDs: ['paymentMethodId'],
            paymentPeriodicities: [PaymentPeriodicity.yearly],
          },
        ],
      });

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();

      await expect(async () => {
        await service.getInfo({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          userId: 'userId',
        });
      }).rejects.toMatchSnapshot();
    });

    it.each([
      {
        forceAutoRenewal: true,
        extendable: false,
        autoRenew: true,
      },
      {
        forceAutoRenewal: true,
        extendable: true,
        autoRenew: false,
      },
      {
        forceAutoRenewal: true,
        extendable: false,
        autoRenew: false,
      },
    ])(
      "should throw an error if the subscription's renewal is not allowed on the new memberplan %o",
      async values => {
        prismaMock.subscription.findUnique.mockResolvedValue({
          userID: 'userId',
          currency: Currency.CHF,
          paymentPeriodicity: PaymentPeriodicity.yearly,
          extendable: values.extendable,
          autoRenew: values.autoRenew,
        });
        prismaMock.memberPlan.findUnique.mockResolvedValue({
          currency: Currency.CHF,
          availablePaymentMethods: [
            {
              paymentMethodIDs: ['paymentMethodId'],
              paymentPeriodicities: [PaymentPeriodicity.yearly],
              forceAutoRenewal: values.forceAutoRenewal,
            },
          ],
        });

        await expect(async () => {
          await service.upgradeSubscription({
            subscriptionId: 'subscriptionId',
            memberPlanId: 'memberPlanId',
            paymentMethodId: 'paymentMethodId',
            userId: 'userId',
            monthlyAmount: 100,
          });
        }).rejects.toMatchSnapshot();

        await expect(async () => {
          await service.getInfo({
            subscriptionId: 'subscriptionId',
            memberPlanId: 'memberPlanId',
            userId: 'userId',
          });
        }).rejects.toMatchSnapshot();
      }
    );

    it('should throw an error if the subscription has no period', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        userID: 'userId',
        currency: Currency.CHF,
        paymentPeriodicity: PaymentPeriodicity.yearly,
        extendable: true,
        autoRenew: true,
        periods: [],
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({
        currency: Currency.CHF,
        availablePaymentMethods: [
          {
            paymentMethodIDs: ['paymentMethodId'],
            paymentPeriodicities: [PaymentPeriodicity.yearly],
            forceAutoRenewal: true,
          },
        ],
      });

      await expect(async () => {
        await service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 100,
        });
      }).rejects.toMatchSnapshot();

      await expect(async () => {
        await service.getInfo({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          userId: 'userId',
        });
      }).rejects.toMatchSnapshot();
    });
  });
});
