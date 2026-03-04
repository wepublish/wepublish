import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient, Subscription } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { SubscriptionDataloader } from './subscription.dataloader';
import {
  CancelPublicSubscriptionInput,
  CreatePublicSubscriptionInput,
  ImportPublicSubscriptionInput,
  SubscriptionFilter,
  SubscriptionListArgs,
  SubscriptionsCSVArgs,
  SubscriptionSort,
  UpdatePublicSubscriptionInput,
} from './subscription.model';
import { MemberContextService } from '../legacy/member-context.service';
import {
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from '@wepublish/payment/api';
import { SubscriptionWithRelations } from '../legacy/member-context';
import { unselectPassword } from '@wepublish/authentication/api';
import { mapSubscriptionsAsCsv } from './subscription-as-csv';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaClient,
    private memberContext: MemberContextService,
    @Inject(PAYMENT_METHOD_CONFIG)
    private paymentMethodConfig: PaymentMethodConfig
  ) {}

  @PrimeDataLoader(SubscriptionDataloader)
  async getSubscriptions({
    filter,
    sort = SubscriptionSort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: SubscriptionListArgs) {
    const where = createSubscriptionFilter(filter ?? {});
    const orderBy = createSubscriptionOrder(sort, order);

    const [totalCount, subscriptions] = await Promise.all([
      this.prisma.subscription.count({
        where,
        orderBy,
      }),
      this.prisma.subscription.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = subscriptions.slice(0, getMaxTake(take));
    const firstSubscription = nodes[0];
    const lastSubscription = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = subscriptions.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstSubscription?.id,
        endCursor: lastSubscription?.id,
      },
    };
  }

  @PrimeDataLoader(SubscriptionDataloader)
  async updateSubscription({
    id,
    properties,
    ...input
  }: UpdatePublicSubscriptionInput) {
    const originalSubscription = await this.prisma.subscription.findUnique({
      where: {
        id,
      },
      include: {
        properties: true,
        deactivation: true,
        paymentMethod: true,
      },
    });

    if (!originalSubscription) {
      throw new NotFoundException('Subscription not found.');
    }

    if (originalSubscription.deactivation) {
      throw new Error(
        'You are not allowed to change a deactivated subscription!'
      );
    }

    // handle remote managed subscriptions (Payrexx Subscription)
    const paymentMethod = originalSubscription.paymentMethod;

    if (!paymentMethod) {
      throw new NotFoundException(
        'PaymentMethod',
        originalSubscription.paymentMethodID
      );
    }

    const paymentProvider = this.paymentMethodConfig.paymentProviders.find(
      paymentProvider => paymentProvider.id === paymentMethod.paymentProviderID
    );

    if (paymentProvider?.remoteManagedSubscription) {
      await this.memberContext.updateRemoteSubscription({
        paymentProvider,
        input: input as Subscription,
        originalSubscription,
      });
    }

    const memberPlan = await this.prisma.memberPlan.findUnique({
      where: {
        id: input.memberPlanID as string,
      },
      select: {
        currency: true,
      },
    });

    if (!memberPlan) {
      throw new NotFoundException(
        `Can not update subscription. Memberplan with id ${input.memberPlanID} not found.`
      );
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        ...input,
        currency: memberPlan.currency,
        properties:
          properties ?
            {
              deleteMany: {
                subscriptionId: id,
              },
              createMany: {
                data: properties,
              },
            }
          : undefined,
      },
      include: {
        deactivation: true,
        periods: true,
        properties: true,
      },
    });

    return await this.memberContext.handleSubscriptionChange({
      subscription: updatedSubscription as SubscriptionWithRelations,
    });
  }

  async getSubscriptionsAsCSV(filter: SubscriptionsCSVArgs) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: createSubscriptionFilter(filter),
      orderBy: {
        modifiedAt: 'desc',
      },
      include: {
        deactivation: true,
        periods: true,
        properties: true,
        memberPlan: true,
        user: {
          select: unselectPassword,
        },
        paymentMethod: true,
      },
    });

    return mapSubscriptionsAsCsv(subscriptions);
  }

  @PrimeDataLoader(SubscriptionDataloader)
  async createSubscription(input: CreatePublicSubscriptionInput) {
    const { subscription } = await this.memberContext.createSubscription(input);

    return subscription;
  }

  @PrimeDataLoader(SubscriptionDataloader)
  async importSubscription({ ...input }: ImportPublicSubscriptionInput) {
    const { subscription } = await this.memberContext.importSubscription(input);

    return subscription;
  }

  @PrimeDataLoader(SubscriptionDataloader)
  async cancelSubscription({ id, reason }: CancelPublicSubscriptionInput) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        deactivation: true,
        periods: true,
        properties: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id ${id} was not found.`);
    }

    if (subscription.deactivation) {
      const msg =
        subscription.deactivation.date < new Date() ?
          'Subscription is already canceled'
        : 'Subscription is already marked to be canceled';

      throw new BadRequestException(msg);
    }

    return await this.memberContext.deactivateSubscription({
      subscription,
      deactivationReason: reason,
    });
  }

  async deleteSubscription(id: string) {
    return this.prisma.subscription.delete({
      where: {
        id,
      },
    });
  }

  async renewSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        deactivation: true,
        periods: true,
        properties: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('subscription', id);
    }

    const unpaidInvoiceCount = await this.prisma.invoice.count({
      where: {
        subscriptionID: subscription.id,
        paidAt: null,
      },
    });

    if (unpaidInvoiceCount > 0) {
      throw new BadRequestException(
        'You cant create new invoice while you have unpaid invoices!'
      );
    }

    await this.memberContext.renewSubscriptionForUser({
      subscription,
    });

    return subscription;
  }
}

export const createSubscriptionOrder = (
  field: SubscriptionSort,
  sortOrder: SortOrder
): Prisma.SubscriptionFindManyArgs['orderBy'] => {
  switch (field) {
    case SubscriptionSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case SubscriptionSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createStartsAtFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.startsAtFrom) {
    const { comparison, date } = filter.startsAtFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      startsAt: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createStartsAtToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.startsAtTo) {
    const { comparison, date } = filter.startsAtTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      startsAt: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createPaidUntilFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paidUntilFrom) {
    const { comparison, date } = filter.paidUntilFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      paidUntil: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createPaidUntilToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paidUntilTo) {
    const { comparison, date } = filter.paidUntilTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      paidUntil: {
        [compare]: date,
      },
    };
  }

  return {};
};

const createDeactivationDateFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationDateFrom) {
    const { comparison, date } = filter.deactivationDateFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          date: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createDeactivationDateToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationDateTo) {
    const { comparison, date } = filter.deactivationDateTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          date: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createCancellationDateFromFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.cancellationDateFrom) {
    const { comparison, date } = filter.cancellationDateFrom;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          createdAt: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createCancellationDateToFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.cancellationDateTo) {
    const { comparison, date } = filter.cancellationDateTo;
    const compare = mapDateFilterToPrisma(comparison);

    return {
      deactivation: {
        is: {
          createdAt: {
            [compare]: date,
          },
        },
      },
    };
  }

  return {};
};

const createDeactivationReasonFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.deactivationReason) {
    return {
      deactivation: {
        reason: filter.deactivationReason,
      },
    };
  }

  return {};
};

const createAutoRenewFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.autoRenew != null) {
    return {
      autoRenew: filter.autoRenew,
    };
  }

  return {};
};

const createExtendableFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.extendable != null) {
    return {
      extendable: filter.extendable,
    };
  }

  return {};
};

const createPaymentPeriodicityFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paymentPeriodicity) {
    return {
      paymentPeriodicity: filter.paymentPeriodicity,
    };
  }

  return {};
};

const createPaymentMethodFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.paymentMethodID) {
    return {
      paymentMethodID: filter.paymentMethodID,
    };
  }

  return {};
};

const createMemberPlanFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.memberPlanID) {
    return {
      memberPlanID: filter.memberPlanID,
    };
  }

  return {};
};

const createHasAddressFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.userHasAddress) {
    return {
      user: {
        isNot: {
          address: null,
        },
      },
    };
  }

  return {};
};

const createUserIDsFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.userIDs) {
    if (filter.userIDs.length > 0) {
      return {
        userID: {
          in: filter.userIDs,
        },
      };
    } else {
      return {
        userID: {
          in: ['___none___'],
        },
      };
    }
  }
  return {};
};

const createSubscriptionIDsFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.subscriptionIDs) {
    if (filter.subscriptionIDs.length > 0) {
      return {
        id: {
          in: filter.subscriptionIDs,
        },
      };
    } else {
      return {
        id: {
          in: ['___none___'],
        },
      };
    }
  }
  return {};
};

const createUserFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.userID) {
    return {
      user: {
        id: filter.userID,
      },
    };
  }
  return {};
};

export const createSubscriptionFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => ({
  AND: [
    createStartsAtFromFilter(filter),
    createStartsAtToFilter(filter),
    createPaidUntilFromFilter(filter),
    createPaidUntilToFilter(filter),
    createDeactivationDateFromFilter(filter),
    createDeactivationDateToFilter(filter),
    createCancellationDateToFilter(filter),
    createCancellationDateFromFilter(filter),
    createDeactivationReasonFilter(filter),
    createAutoRenewFilter(filter),
    createPaymentPeriodicityFilter(filter),
    createPaymentMethodFilter(filter),
    createMemberPlanFilter(filter),
    createHasAddressFilter(filter),
    createUserFilter(filter),
    createExtendableFilter(filter),
    createUserIDsFilter(filter),
    createSubscriptionIDsFilter(filter),
  ],
});
