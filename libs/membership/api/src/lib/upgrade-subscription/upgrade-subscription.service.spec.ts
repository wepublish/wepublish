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
    };
    memberPlan: {
      findUnique: jest.Mock;
    };
  };

  beforeAll(async () => {
    prismaMock = {
      subscription: {
        findUnique: jest.fn(),
      },
      memberPlan: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpgradeSubscriptionService,
        MemberContextService,
        PaymentsService,
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
