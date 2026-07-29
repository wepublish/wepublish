import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { UserSubscriptionService } from './user-subscription.service';
import {
  GoodieService,
  MemberContextService,
  VoucherDataloader,
} from '@wepublish/membership/api';
import { PaymentsService } from '@wepublish/payment/api';
import {
  MemberPlanDataloader,
  MemberPlanService,
} from '@wepublish/member-plan/api';

describe('UserSubscriptionService', () => {
  let service: UserSubscriptionService;

  let prismaMock: {
    voucher: { findUnique: jest.Mock };
    paymentMethod: { findFirst: jest.Mock };
    subscription: { findUnique: jest.Mock };
  };

  let memberContextMock: {
    validateInputParamsCreateSubscription: jest.Mock;
    validateSubscriptionPaymentConfiguration: jest.Mock;
    processSubscriptionProperties: jest.Mock;
    createSubscription: jest.Mock;
    deactivateSubscription: jest.Mock;
  };

  let memberPlanDataloaderMock: {
    load: jest.Mock;
  };

  let voucherDataloaderMock: {
    prime: jest.Mock;
  };

  let paymentsMock: {
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
      voucher: { findUnique: jest.fn() },
      paymentMethod: {
        findFirst: jest.fn().mockResolvedValue({ id: 'paymentMethodId' }),
      },
      subscription: { findUnique: jest.fn() },
    };

    memberContextMock = {
      validateInputParamsCreateSubscription: jest
        .fn()
        .mockResolvedValue(undefined),
      validateSubscriptionPaymentConfiguration: jest
        .fn()
        .mockResolvedValue(undefined),
      processSubscriptionProperties: jest.fn().mockResolvedValue([]),
      createSubscription: jest.fn().mockResolvedValue({
        subscription: { id: 'subscriptionId' },
        invoice: { id: 'invoiceId' },
      }),
      deactivateSubscription: jest.fn().mockResolvedValue(undefined),
    };

    memberPlanDataloaderMock = {
      load: jest.fn().mockResolvedValue({
        id: 'memberPlanId',
        active: true,
        extendable: true,
        amountPerMonthMin: 0,
      }),
    };

    voucherDataloaderMock = {
      prime: jest.fn(),
    };

    paymentsMock = {
      createPaymentWithProvider: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSubscriptionService,
        { provide: MemberContextService, useValue: memberContextMock },
        { provide: VoucherDataloader, useValue: voucherDataloaderMock },
        { provide: MemberPlanDataloader, useValue: memberPlanDataloaderMock },
        {
          provide: MemberPlanService,
          useValue: { getMemberPlanBySlug: jest.fn() },
        },
        { provide: PaymentsService, useValue: paymentsMock },
        {
          provide: GoodieService,
          useValue: { getValidGoodie: jest.fn() },
        },
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UserSubscriptionService>(UserSubscriptionService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    memberContextMock.validateInputParamsCreateSubscription.mockResolvedValue(
      undefined
    );
    memberContextMock.validateSubscriptionPaymentConfiguration.mockResolvedValue(
      undefined
    );
    memberContextMock.processSubscriptionProperties.mockResolvedValue([]);
    memberContextMock.createSubscription.mockResolvedValue({
      subscription: { id: 'subscriptionId' },
      invoice: { id: 'invoiceId' },
    });
    memberPlanDataloaderMock.load.mockResolvedValue({
      id: 'memberPlanId',
      active: true,
      extendable: true,
      amountPerMonthMin: 0,
    });
    prismaMock.paymentMethod.findFirst.mockResolvedValue({
      id: 'paymentMethodId',
    });
    paymentsMock.createPaymentWithProvider.mockResolvedValue({});
  });

  describe('createSubscription', () => {
    const baseArgs = {
      memberPlanID: 'memberPlanId',
      autoRenew: true,
      paymentPeriodicity: PaymentPeriodicity.monthly,
      monthlyAmount: 100,
      paymentMethodID: 'paymentMethodId',
    };

    const validVoucher = {
      id: 'voucherId',
      discountPercent: 20,
      validFrom: new Date('2024-01-01'),
      validTo: new Date('2026-01-01'),
    };

    describe('happy path', () => {
      it('should create subscription without voucher and pass no discount', async () => {
        await service.createSubscription('userId', baseArgs);

        expect(memberContextMock.createSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ discount: undefined, voucherId: undefined })
        );
      });

      it('should apply voucher discount for a monthly subscription', async () => {
        prismaMock.voucher.findUnique.mockResolvedValue(validVoucher);

        await service.createSubscription('userId', {
          ...baseArgs,
          voucher: 'testvoucher',
          paymentPeriodicity: PaymentPeriodicity.monthly,
          monthlyAmount: 100,
        });

        // monthly: 100 * 1 = 100, 20% of 100 = 20
        expect(memberContextMock.createSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ discount: 20, voucherId: 'voucherId' })
        );
      });

      it('should apply voucher discount for a yearly subscription', async () => {
        prismaMock.voucher.findUnique.mockResolvedValue({
          ...validVoucher,
          discountPercent: 10,
        });

        await service.createSubscription('userId', {
          ...baseArgs,
          voucher: 'testvoucher',
          paymentPeriodicity: PaymentPeriodicity.yearly,
          monthlyAmount: 100,
        });

        // yearly: 100 * 12 = 1200, 10% of 1200 = 120
        expect(memberContextMock.createSubscription).toHaveBeenCalledWith(
          expect.objectContaining({ discount: 120, voucherId: 'voucherId' })
        );
      });
    });

    describe('unhappy path', () => {
      it('should throw if voucher is not found', async () => {
        prismaMock.voucher.findUnique.mockResolvedValue(null);

        await expect(
          service.createSubscription('userId', {
            ...baseArgs,
            voucher: 'invalid',
          })
        ).rejects.toMatchSnapshot();
      });

      it('should throw if voucher is not yet valid', async () => {
        prismaMock.voucher.findUnique.mockResolvedValue({
          ...validVoucher,
          validFrom: new Date('2025-06-01'),
        });

        await expect(
          service.createSubscription('userId', {
            ...baseArgs,
            voucher: 'testvoucher',
          })
        ).rejects.toMatchSnapshot();
      });

      it('should throw if voucher has expired', async () => {
        prismaMock.voucher.findUnique.mockResolvedValue({
          ...validVoucher,
          validTo: new Date('2024-12-31'),
        });

        await expect(
          service.createSubscription('userId', {
            ...baseArgs,
            voucher: 'testvoucher',
          })
        ).rejects.toMatchSnapshot();
      });
    });
  });
});
