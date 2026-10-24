import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Currency,
  GiftCodeOffer,
  MemberPlan,
  MemberPlanPeriodicityPrice,
  PaymentMethod,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { PaymentsService } from '@wepublish/payment/api';
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
};

@Injectable()
export class GiftCodeOfferService {
  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService,
    private publicContentCache: PublicContentCacheInvalidator
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

  async getActiveOffersByIds(ids: string[]): Promise<GiftCodeOffer[]> {
    if (!ids.length) {
      return [];
    }

    const offers = await this.prisma.giftCodeOffer.findMany({
      where: {
        id: { in: ids },
        active: true,
        memberPlan: { active: true },
      },
    });

    return offers.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
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

  async createOffer({ paymentMethodIds, ...input }: CreateGiftCodeOfferInput) {
    await this.validate({ ...input, paymentMethodIds });

    const offer = await this.prisma.giftCodeOffer.create({
      data: {
        ...input,
        paymentMethods: {
          connect: paymentMethodIds.map(id => ({ id })),
        },
      },
    });

    await this.publicContentCache.invalidate('pages', 'articles');

    return offer;
  }

  async updateOffer({
    id,
    paymentMethodIds,
    ...input
  }: UpdateGiftCodeOfferInput) {
    const existing = await this.prisma.giftCodeOffer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Gift code offer ${id} was not found.`);
    }

    await this.validate({
      memberPlanId: input.memberPlanId ?? existing.memberPlanId,
      periodicity: input.periodicity ?? existing.periodicity,
      redemptionWindowMonths:
        input.redemptionWindowMonths !== undefined ?
          input.redemptionWindowMonths
        : existing.redemptionWindowMonths,
      paymentMethodIds,
    });

    const offer = await this.prisma.giftCodeOffer.update({
      where: { id },
      data: {
        ...input,
        paymentMethods:
          paymentMethodIds ?
            { set: paymentMethodIds.map(methodId => ({ id: methodId })) }
          : undefined,
      },
    });

    await this.publicContentCache.invalidate('pages', 'articles');

    return offer;
  }

  async deleteOffer(id: string) {
    const soldCodes = await this.prisma.giftCode.count({
      where: { offerId: id },
    });

    if (soldCodes) {
      throw new BadRequestException(
        'This offer has sold gift codes. Deactivate it instead.'
      );
    }

    const offer = await this.prisma.giftCodeOffer.delete({ where: { id } });

    await this.publicContentCache.invalidate('pages', 'articles');

    return offer;
  }

  private async validate({
    memberPlanId,
    periodicity,
    redemptionWindowMonths,
    paymentMethodIds,
  }: GiftCodeOfferRules) {
    if (redemptionWindowMonths != null && redemptionWindowMonths <= 0) {
      throw new BadRequestException(
        'The redemption window must be at least one month'
      );
    }

    const memberPlan = await this.prisma.memberPlan.findUnique({
      where: { id: memberPlanId },
      include: { periodicityPricing: true },
    });

    if (!memberPlan) {
      throw new BadRequestException(`Member plan ${memberPlanId} not found`);
    }

    if (this.getPrice({ periodicity, memberPlan }).amount <= 0) {
      throw new BadRequestException(
        'The member plan has no price for this periodicity'
      );
    }

    if (paymentMethodIds) {
      await this.validatePaymentMethods(paymentMethodIds);
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
