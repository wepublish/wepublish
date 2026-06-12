import { BadRequestException } from '@nestjs/common';
import {
  AmountSelectionLayout,
  Currency,
  PaymentPeriodicity,
  PrismaClient,
  ProductType,
} from '@prisma/client';
import { CreateMemberPlanInput } from './member-plan.model';
import { MemberPlanService } from './member-plan.service';

describe('MemberPlanService', () => {
  const createMock = jest.fn();
  const findUniqueOrThrowMock = jest.fn();
  const updateMock = jest.fn();
  const service = new MemberPlanService({
    memberPlan: {
      create: createMock,
      findUniqueOrThrow: findUniqueOrThrowMock,
      update: updateMock,
    },
  } as unknown as PrismaClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createInput = (
    input: Partial<CreateMemberPlanInput> = {}
  ): CreateMemberPlanInput =>
    ({
      name: 'Member',
      slug: 'member',
      active: true,
      tags: [],
      description: [],
      shortDescription: [],
      amountPerMonthMin: 1000,
      amountPerMonthMax: 5000,
      amountPerMonthTarget: 1500,
      amountSelectionLayout: AmountSelectionLayout.Picker,
      presetAmounts: [1000, 2500, 5000],
      yearlyAmount: null,
      currency: Currency.CHF,
      extendable: true,
      productType: ProductType.Subscription,
      maxCount: null,
      externalReward: null,
      migrateToTargetPaymentMethodID: null,
      successPageId: null,
      failPageId: null,
      confirmationPageId: null,
      imageID: null,
      availablePaymentMethods: [
        {
          paymentMethodIDs: [],
          paymentPeriodicities: [PaymentPeriodicity.monthly],
          forceAutoRenewal: false,
        },
      ],
      ...input,
    }) as CreateMemberPlanInput;

  it('rejects preset amounts below the minimum amount', async () => {
    await expect(
      service.createMemberPlan(
        createInput({
          presetAmounts: [500],
        })
      )
    ).rejects.toThrow(BadRequestException);

    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects preset amounts above the maximum amount', async () => {
    await expect(
      service.createMemberPlan(
        createInput({
          presetAmounts: [6000],
        })
      )
    ).rejects.toThrow(BadRequestException);

    expect(createMock).not.toHaveBeenCalled();
  });
});
