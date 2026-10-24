import { Test, TestingModule } from '@nestjs/testing';
import { Currency, PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { UpgradeSubscriptionService } from './upgrade-subscription.service';

import { MemberContextService } from '../legacy/member-context.service';
import { GoodieService } from '../goodie/goodie.service';
import {
  isPaymentMethodRetired,
  PaymentsService,
} from '@wepublish/payment/api';
import { DiscountCodeService } from '../discountCode/discountCode.service';
import { SettingsService } from '@wepublish/settings/api';
import type { Mock } from 'vitest';

vi.mock('../legacy/member-context.service');
vi.mock('@wepublish/payment/api');

describe('UpgradeSubscriptionService', () => {
  let service: UpgradeSubscriptionService;
  let prismaMock: {
    subscription: {
      findUnique: Mock;
      findMany: Mock;
      update: Mock;
      delete: Mock;
    };
    invoice: {
      findMany: Mock;
      deleteMany: Mock;
    };
    invoiceItem: {
      deleteMany: Mock;
    };
    payment: {
      deleteMany: Mock;
    };
    subscriptionPeriod: {
      update: Mock;
      deleteMany: Mock;
    };
    subscriptionDeactivation: {
      delete: Mock;
    };
    memberPlan: {
      findUnique: Mock;
    };
    paymentMethod: {
      findUnique: Mock;
    };
  };
  let memberContextMock: {
    cancelInvoicesForSubscription: Mock;
    cancelRemoteSubscription: Mock;
    createSubscription: Mock;
  };

  let paymentServiceMock: {
    createPaymentWithProvider: Mock;
  };

  let discountCodeserviceMock: {
    getValidDiscountCode: Mock;
  };

  let goodieServiceMock: {
    getValidGoodie: Mock;
  };

  let settingsServiceMock: {
    settingByName: Mock;
  };

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeAll(async () => {
    prismaMock = {
      subscription: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      invoice: {
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      invoiceItem: {
        deleteMany: vi.fn(),
      },
      payment: {
        deleteMany: vi.fn(),
      },
      subscriptionPeriod: {
        deleteMany: vi.fn(),
      },
      subscriptionPeriod: {
        update: vi.fn(),
        deleteMany: vi.fn(),
      },
      subscriptionDeactivation: {
        delete: vi.fn(),
      },
      memberPlan: {
        findUnique: vi.fn(),
      },
      paymentMethod: {
        findUnique: vi.fn(),
      },
    };
    memberContextMock = {
      cancelInvoicesForSubscription: vi.fn(),
      cancelRemoteSubscription: vi.fn(),
      createSubscription: vi.fn(),
    };
    paymentServiceMock = {
      createPaymentWithProvider: vi.fn(),
    };
    discountCodeserviceMock = {
      getValidDiscountCode: vi.fn(),
    };
    goodieServiceMock = {
      getValidGoodie: vi.fn(),
    };
    settingsServiceMock = {
      settingByName: vi.fn().mockResolvedValue({ value: false }),
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
        {
          provide: DiscountCodeService,
          useValue: discountCodeserviceMock,
        },
        {
          provide: GoodieService,
          useValue: goodieServiceMock,
        },
        {
          provide: SettingsService,
          useValue: settingsServiceMock,
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
        autoRenew: false,
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
            endsAt: new Date('2025-01-03'),
            createdAt: new Date('2024-01-03'),
            startsAt: new Date('2024-01-03'),
            invoice: {
              paidAt: new Date('2024-01-03'),
            },
          },
          {
            id: '5',
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
            id: '6',
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
      // Should not be 500 as the period has ended
      // Should not be 600 because 2 periods are still active and 5 comes from the nearly ended one
      expect(result.discountAmount).toBe(605);
    });
  });

  describe('full difference upgrade model', () => {
    const activeSubscription = {
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
          amount: 6000,
          startsAt: new Date('2024-07-01'),
          endsAt: new Date('2025-07-01'),
          createdAt: new Date('2024-07-01'),
          invoice: {
            paidAt: new Date('2024-07-01'),
          },
        },
        {
          id: '2',
          paymentPeriodicity: PaymentPeriodicity.yearly,
          amount: 9999,
          startsAt: new Date('2026-01-01'),
          endsAt: new Date('2027-01-01'),
          createdAt: new Date('2026-01-01'),
          invoice: {
            paidAt: null,
          },
        },
      ],
    };

    const memberPlan = {
      currency: Currency.CHF,
      availablePaymentMethods: [
        {
          paymentMethodIDs: ['paymentMethodId'],
          paymentPeriodicities: [PaymentPeriodicity.yearly],
          forceAutoRenewal: true,
        },
      ],
    };

    const getInfoArgs = {
      subscriptionId: 'subscriptionId',
      memberPlanId: 'memberPlanId',
      userId: 'userId',
    };

    it('credits the full paid period amount when the setting is enabled', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(activeSubscription);
      prismaMock.memberPlan.findUnique.mockResolvedValue(memberPlan);
      settingsServiceMock.settingByName.mockResolvedValueOnce({ value: true });

      const result = await service.getInfo(getInfoArgs);

      expect(result.discountAmount).toBe(6000);
    });

    it('credits only the pro-rated remainder when the setting is disabled', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(activeSubscription);
      prismaMock.memberPlan.findUnique.mockResolvedValue(memberPlan);
      settingsServiceMock.settingByName.mockResolvedValueOnce({ value: false });

      const result = await service.getInfo(getInfoArgs);

      expect(result.discountAmount).toBeGreaterThan(0);
      expect(result.discountAmount).toBeLessThan(6000);
    });

    it('falls back to the pro-rated remainder when the setting row is missing', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(activeSubscription);
      prismaMock.memberPlan.findUnique.mockResolvedValue(memberPlan);

      settingsServiceMock.settingByName.mockResolvedValueOnce({ value: false });
      const proRata = (await service.getInfo(getInfoArgs)).discountAmount;

      settingsServiceMock.settingByName.mockRejectedValueOnce(
        new Error(
          'Setting with name subscriptionUpgradeBillsFullDifference not found'
        )
      );
      const fallback = (await service.getInfo(getInfoArgs)).discountAmount;

      expect(fallback).toBe(proRata);
      expect(fallback).toBeLessThan(6000);
    });
  });

  describe('imported periods that stored the monthly amount', () => {
    const importedSubscription = {
      id: 'subscriptionId',
      userID: 'userId',
      currency: Currency.CHF,
      paymentPeriodicity: PaymentPeriodicity.yearly,
      monthlyAmount: 500,
      extendable: true,
      autoRenew: true,
      periods: [
        {
          id: '1',
          paymentPeriodicity: PaymentPeriodicity.yearly,
          amount: 500,
          startsAt: new Date('2024-07-01'),
          endsAt: new Date('2025-07-01'),
          createdAt: new Date('2024-07-01'),
          invoice: {
            paidAt: new Date('2024-07-01'),
          },
        },
      ],
    };

    const memberPlan = {
      currency: Currency.CHF,
      availablePaymentMethods: [
        {
          paymentMethodIDs: ['paymentMethodId'],
          paymentPeriodicities: [PaymentPeriodicity.yearly],
          forceAutoRenewal: true,
        },
      ],
    };

    const getInfoArgs = {
      subscriptionId: 'subscriptionId',
      memberPlanId: 'memberPlanId',
      userId: 'userId',
    };

    it('credits the full yearly amount when the period stored only the monthly amount', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        importedSubscription
      );
      prismaMock.memberPlan.findUnique.mockResolvedValue(memberPlan);
      settingsServiceMock.settingByName.mockResolvedValueOnce({ value: true });

      const result = await service.getInfo(getInfoArgs);

      expect(result.discountAmount).toBe(6000);
    });

    it('keeps a genuine period amount that differs from the monthly amount', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        ...importedSubscription,
        periods: [{ ...importedSubscription.periods[0], amount: 4800 }],
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue(memberPlan);
      settingsServiceMock.settingByName.mockResolvedValueOnce({ value: true });

      const result = await service.getInfo(getInfoArgs);

      expect(result.discountAmount).toBe(4800);
    });
  });

  describe('unhappy path', () => {
    it('should throw an error if the payment method belongs to a deleted provider', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        id: 'subscriptionId',
        userID: 'userId',
        memberPlanID: 'oldMemberPlanId',
        currency: Currency.CHF,
        paymentPeriodicity: PaymentPeriodicity.yearly,
        periods: [],
      });
      prismaMock.memberPlan.findUnique.mockResolvedValue({
        id: 'memberPlanId',
        currency: Currency.CHF,
        availablePaymentMethods: [
          {
            paymentMethodIDs: ['paymentMethodId'],
            paymentPeriodicities: [PaymentPeriodicity.yearly],
            forceAutoRenewal: false,
          },
        ],
      });
      prismaMock.paymentMethod.findUnique.mockResolvedValue({
        id: 'paymentMethodId',
        paymentProviderID: 'mollie',
      });
      vi.mocked(isPaymentMethodRetired).mockResolvedValueOnce(true);

      await expect(
        service.upgradeSubscription({
          subscriptionId: 'subscriptionId',
          memberPlanId: 'memberPlanId',
          paymentMethodId: 'paymentMethodId',
          userId: 'userId',
          monthlyAmount: 80,
        })
      ).rejects.toThrow('is no longer offered');
      expect(isPaymentMethodRetired).toHaveBeenCalledWith(prismaMock, {
        id: 'paymentMethodId',
        paymentProviderID: 'mollie',
      });
    });

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

  describe('revertUpgrade', () => {
    const replacedSubscription = {
      id: 'oldSubscriptionId',
      userID: 'userId',
      paymentPeriodicity: PaymentPeriodicity.yearly,
      paidUntil: new Date('2025-01-01'),
      deactivation: {
        id: 'deactivationId',
        date: new Date('2025-01-01'),
      },
      periods: [
        {
          id: 'periodId',
          startsAt: new Date('2024-06-01'),
          // truncated by the upgrade
          endsAt: new Date('2025-01-01'),
          paymentPeriodicity: PaymentPeriodicity.yearly,
        },
      ],
    };

    const replacement = {
      id: 'newSubscriptionId',
      userID: 'userId',
      replacesSubscriptionID: 'oldSubscriptionId',
      invoices: [{ id: 'newInvoiceId', paidAt: null }],
    };

    it('removes the replacement subscription and restores the original one', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        replacedSubscription
      );
      prismaMock.subscription.findMany.mockResolvedValue([replacement]);
      prismaMock.invoice.findMany.mockResolvedValue(replacement.invoices);

      await service.revertUpgrade({
        subscriptionId: 'oldSubscriptionId',
        userId: null,
      });

      // the invoice of the upgrade and everything hanging off it goes with it
      expect(prismaMock.payment.deleteMany).toHaveBeenCalledWith({
        where: { invoiceID: { in: ['newInvoiceId'] } },
      });
      expect(prismaMock.subscriptionPeriod.deleteMany).toHaveBeenCalledWith({
        where: { invoiceID: { in: ['newInvoiceId'] } },
      });
      expect(prismaMock.invoiceItem.deleteMany).toHaveBeenCalledWith({
        where: { invoiceId: { in: ['newInvoiceId'] } },
      });
      expect(prismaMock.invoice.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['newInvoiceId'] } },
      });
      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({
        where: { id: 'newSubscriptionId' },
      });
      expect(prismaMock.subscriptionDeactivation.delete).toHaveBeenCalledWith({
        where: { subscriptionID: 'oldSubscriptionId' },
      });
    });

    it('restores the period and paidUntil the upgrade cut short', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        replacedSubscription
      );
      prismaMock.subscription.findMany.mockResolvedValue([replacement]);
      prismaMock.invoice.findMany.mockResolvedValue(replacement.invoices);

      await service.revertUpgrade({
        subscriptionId: 'oldSubscriptionId',
        userId: null,
      });

      // yearly period starting 2024-06-01 originally ran until 2025-05-31
      expect(prismaMock.subscriptionPeriod.update).toHaveBeenCalledWith({
        where: { id: 'periodId' },
        data: { endsAt: new Date('2025-05-31') },
      });
      expect(prismaMock.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'oldSubscriptionId' },
          data: expect.objectContaining({ paidUntil: new Date('2025-05-31') }),
        })
      );
    });

    it('refuses to revert when the replacement has been paid', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        replacedSubscription
      );
      prismaMock.subscription.findMany.mockResolvedValue([
        {
          ...replacement,
          invoices: [{ id: 'newInvoiceId', paidAt: new Date('2025-01-02') }],
        },
      ]);

      await expect(
        service.revertUpgrade({
          subscriptionId: 'oldSubscriptionId',
          userId: null,
        })
      ).rejects.toThrow();
      expect(prismaMock.subscription.delete).not.toHaveBeenCalled();
    });

    it('refuses to revert a subscription that was never upgraded', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        replacedSubscription
      );
      prismaMock.subscription.findMany.mockResolvedValue([]);

      await expect(
        service.revertUpgrade({
          subscriptionId: 'oldSubscriptionId',
          userId: null,
        })
      ).rejects.toThrow();
      expect(prismaMock.subscription.delete).not.toHaveBeenCalled();
    });

    it('reverts the upgrade of another user when run without a user', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        ...replacedSubscription,
        userID: 'someoneElse',
      });
      prismaMock.subscription.findMany.mockResolvedValue([replacement]);
      prismaMock.invoice.findMany.mockResolvedValue(replacement.invoices);

      // admins revert without a user, which skips the ownership check
      await service.revertUpgrade({
        subscriptionId: 'oldSubscriptionId',
        userId: null,
      });

      expect(prismaMock.subscription.delete).toHaveBeenCalledWith({
        where: { id: 'newSubscriptionId' },
      });
    });

    it('refuses to revert a subscription of another user', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        replacedSubscription
      );

      await expect(
        service.revertUpgrade({
          subscriptionId: 'oldSubscriptionId',
          userId: 'someoneElse',
        })
      ).rejects.toThrow();
      expect(prismaMock.subscription.delete).not.toHaveBeenCalled();
    });
  });
});
