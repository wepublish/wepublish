import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailablePaymentMethod,
  Currency,
  GiftCodeOffer,
  MemberPlan,
  MemberPlanPeriodicityPrice,
  PaymentMethod,
  PaymentPeriodicity,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import {
  isPaymentMethodRetired,
  PaymentsService,
} from '@wepublish/payment/api';
import {
  getMaxTake,
  getPeriodPriceRange,
  SortOrder,
} from '@wepublish/utils/api';
import {
  CreateGiftCodeOfferInput,
  GiftCodeOfferFilter,
  GiftCodeOfferListArgs,
  GiftCodeOfferSort,
  UpdateGiftCodeOfferInput,
} from './gift-code-offer.model';

export type GiftCodeOfferPricing = Pick<GiftCodeOffer, 'periodicity'> & {
  memberPlan: Pick<MemberPlan, 'currency'> & {
    periodicityPricing: Pick<
      MemberPlanPeriodicityPrice,
      'periodicity' | 'amountMin' | 'amountTarget' | 'amountMax'
    >[];
  };
};

type GiftCodeOfferRules = Pick<
  CreateGiftCodeOfferInput,
  'memberPlanId' | 'periodicity' | 'redemptionWindowMonths'
> & {
  paymentMethodIds?: string[];
  autoRenew: boolean;
  renewalPaymentMethodId: string | null;
};

const isSold = (
  memberPlan: {
    availablePaymentMethods: Pick<
      AvailablePaymentMethod,
      'paymentPeriodicities'
    >[];
  },
  periodicity: PaymentPeriodicity
) =>
  memberPlan.availablePaymentMethods.some(row =>
    row.paymentPeriodicities.includes(periodicity)
  );

const duplicateMemberPlan = () =>
  new BadRequestException('This member plan already has a gift offer.');

const rethrowDuplicateMemberPlan = (error: unknown): never => {
  if ((error as { code?: string })?.code === 'P2002') {
    throw duplicateMemberPlan();
  }

  throw error;
};

@Injectable()
export class GiftCodeOfferService {
  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService
  ) {}

  async getOffers({
    filter,
    sort = GiftCodeOfferSort.ModifiedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: GiftCodeOfferListArgs) {
    const where = createGiftCodeOfferFilter(filter);
    const orderBy = createGiftCodeOfferOrder(sort, order);

    const [totalCount, offers] = await Promise.all([
      this.prisma.giftCodeOffer.count({ where }),
      this.prisma.giftCodeOffer.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = offers.slice(0, getMaxTake(take));

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: Boolean(skip),
        hasNextPage: offers.length > nodes.length,
        startCursor: nodes[0]?.id,
        endCursor: nodes[nodes.length - 1]?.id,
      },
    };
  }

  async getOffer(id: string) {
    return this.prisma.giftCodeOffer.findUnique({ where: { id } });
  }

  getPrice({ periodicity, memberPlan }: GiftCodeOfferPricing): {
    amount: number;
    currency: Currency;
  } {
    const range = getPeriodPriceRange(memberPlan, periodicity);

    return {
      amount: range.amountTarget ?? range.amountMin,
      currency: memberPlan.currency,
    };
  }

  async getPaymentMethodIds(offerId: string): Promise<string[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { giftCodeOffers: { some: { id: offerId } } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    return paymentMethods.map(({ id }) => id);
  }

  async getPaymentMethods(offerId: string): Promise<PaymentMethod[]> {
    return this.payments.getStandalonePaymentMethods(
      await this.getPaymentMethodIds(offerId)
    );
  }

  async createOffer({
    paymentMethodIds,
    allowDiscountCodes,
    autoRenew,
    renewalPaymentMethodId,
    ...input
  }: CreateGiftCodeOfferInput) {
    await this.validate({
      ...input,
      paymentMethodIds,
      autoRenew: autoRenew ?? false,
      renewalPaymentMethodId: renewalPaymentMethodId ?? null,
    });
    await this.assertMemberPlanIsFree(input.memberPlanId);

    return this.prisma.giftCodeOffer
      .create({
        data: {
          ...input,
          allowDiscountCodes: allowDiscountCodes ?? undefined,
          autoRenew: autoRenew ?? undefined,
          renewalPaymentMethodId: renewalPaymentMethodId ?? undefined,
          paymentMethods: {
            connect: paymentMethodIds.map(id => ({ id })),
          },
        },
      })
      .catch(rethrowDuplicateMemberPlan);
  }

  async updateOffer({
    id,
    paymentMethodIds,
    allowDiscountCodes,
    autoRenew,
    renewalPaymentMethodId,
    ...input
  }: UpdateGiftCodeOfferInput) {
    const existing = await this.prisma.giftCodeOffer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Gift code offer ${id} was not found.`);
    }

    const renewalPaymentMethodUpdate =
      renewalPaymentMethodId !== undefined ? renewalPaymentMethodId
      : autoRenew === false ? null
      : undefined;

    await this.validate({
      memberPlanId: input.memberPlanId ?? existing.memberPlanId,
      periodicity: input.periodicity ?? existing.periodicity,
      redemptionWindowMonths:
        input.redemptionWindowMonths !== undefined ?
          input.redemptionWindowMonths
        : existing.redemptionWindowMonths,
      paymentMethodIds,
      autoRenew: autoRenew ?? existing.autoRenew,
      renewalPaymentMethodId:
        renewalPaymentMethodUpdate !== undefined ?
          renewalPaymentMethodUpdate
        : existing.renewalPaymentMethodId,
    });
    await this.assertMemberPlanIsFree(
      input.memberPlanId ?? existing.memberPlanId,
      id
    );

    return this.prisma.giftCodeOffer
      .update({
        where: { id },
        data: {
          ...input,
          allowDiscountCodes: allowDiscountCodes ?? undefined,
          autoRenew: autoRenew ?? undefined,
          renewalPaymentMethodId: renewalPaymentMethodUpdate,
          paymentMethods:
            paymentMethodIds ?
              { set: paymentMethodIds.map(methodId => ({ id: methodId })) }
            : undefined,
        },
      })
      .catch(rethrowDuplicateMemberPlan);
  }

  async deleteOffer(id: string) {
    const soldCodes = await this.prisma.giftCode.count({
      where: { offerId: id },
    });

    if (soldCodes) {
      throw new BadRequestException(
        'This offer has gift codes. Deactivate it instead.'
      );
    }

    return this.prisma.giftCodeOffer.delete({ where: { id } });
  }

  private async assertMemberPlanIsFree(memberPlanId: string, offerId?: string) {
    const taken = await this.prisma.giftCodeOffer.findFirst({
      where:
        offerId ? { memberPlanId, id: { not: offerId } } : { memberPlanId },
      select: { id: true },
    });

    if (taken) {
      throw duplicateMemberPlan();
    }
  }

  private async validate({
    memberPlanId,
    periodicity,
    redemptionWindowMonths,
    paymentMethodIds,
    autoRenew,
    renewalPaymentMethodId,
  }: GiftCodeOfferRules) {
    if (redemptionWindowMonths != null && redemptionWindowMonths <= 0) {
      throw new BadRequestException(
        'The redemption window must be at least one month'
      );
    }

    const memberPlan = await this.prisma.memberPlan.findUnique({
      where: { id: memberPlanId },
      include: { periodicityPricing: true, availablePaymentMethods: true },
    });

    if (!memberPlan) {
      throw new BadRequestException(`Member plan ${memberPlanId} not found`);
    }

    if (this.getPrice({ periodicity, memberPlan }).amount <= 0) {
      throw new BadRequestException(
        'The member plan has no price for this periodicity'
      );
    }

    if (!isSold(memberPlan, periodicity)) {
      throw new BadRequestException(
        'The member plan is not sold with this periodicity'
      );
    }

    if (paymentMethodIds) {
      await this.validatePaymentMethods(paymentMethodIds);
    }

    await this.validateRenewal({
      memberPlan,
      periodicity,
      autoRenew,
      renewalPaymentMethodId,
    });
  }

  private async validateRenewal({
    memberPlan,
    periodicity,
    autoRenew,
    renewalPaymentMethodId,
  }: Pick<GiftCodeOfferRules, 'periodicity'> & {
    memberPlan: Pick<MemberPlan, 'extendable'> & {
      availablePaymentMethods: Pick<
        AvailablePaymentMethod,
        'paymentMethodIDs' | 'paymentPeriodicities'
      >[];
    };
    autoRenew: boolean;
    renewalPaymentMethodId: string | null;
  }) {
    if (!autoRenew) {
      if (renewalPaymentMethodId) {
        throw new BadRequestException(
          'Only offers that renew automatically can have a renewal payment method'
        );
      }

      return;
    }

    if (!renewalPaymentMethodId) {
      throw new BadRequestException(
        'Choose a payment method for the automatic renewal'
      );
    }

    if (!memberPlan.extendable) {
      throw new BadRequestException(
        'This member plan cannot be renewed automatically'
      );
    }

    const offered = memberPlan.availablePaymentMethods.some(
      ({ paymentMethodIDs, paymentPeriodicities }) =>
        paymentPeriodicities.includes(periodicity) &&
        paymentMethodIDs.includes(renewalPaymentMethodId)
    );

    if (!offered) {
      throw new BadRequestException(
        'The member plan does not offer this renewal payment method for this periodicity'
      );
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: renewalPaymentMethodId },
    });

    if (
      !paymentMethod?.active ||
      (await isPaymentMethodRetired(this.prisma, paymentMethod))
    ) {
      throw new BadRequestException(
        `Payment method ${paymentMethod?.name ?? renewalPaymentMethodId} cannot be used for renewals`
      );
    }
  }

  private async validatePaymentMethods(paymentMethodIds: string[]) {
    if (!paymentMethodIds.length) {
      throw new BadRequestException(
        'Gift code offers need at least one payment method'
      );
    }

    for (const id of paymentMethodIds) {
      try {
        await this.payments.assertStandalonePaymentMethod(id);
      } catch (error) {
        if (!(error instanceof BadRequestException)) {
          throw error;
        }

        const paymentMethod = await this.prisma.paymentMethod.findUnique({
          where: { id },
        });

        throw new BadRequestException(
          `Payment method ${paymentMethod?.name ?? id} cannot be used for gift codes`
        );
      }
    }
  }
}

function createGiftCodeOfferOrder(
  field: GiftCodeOfferSort,
  sortOrder: SortOrder
): Prisma.GiftCodeOfferOrderByWithRelationInput {
  const direction = sortOrder === SortOrder.Ascending ? 'asc' : 'desc';

  switch (field) {
    case GiftCodeOfferSort.Name:
      return { name: direction };

    case GiftCodeOfferSort.CreatedAt:
      return { createdAt: direction };

    case GiftCodeOfferSort.ModifiedAt:
    default:
      return { modifiedAt: direction };
  }
}

const createGiftCodeOfferFilter = (
  filter?: Partial<GiftCodeOfferFilter>
): Prisma.GiftCodeOfferWhereInput => {
  const conditions: (Prisma.GiftCodeOfferWhereInput | null)[] = [
    filter?.memberPlanId ? { memberPlanId: filter.memberPlanId } : null,
    filter?.active != null ? { active: filter.active } : null,
    filter?.name ?
      { name: { contains: filter.name, mode: 'insensitive' } }
    : null,
  ];

  return {
    AND: conditions.filter((where): where is Prisma.GiftCodeOfferWhereInput =>
      Boolean(where)
    ),
  };
};
