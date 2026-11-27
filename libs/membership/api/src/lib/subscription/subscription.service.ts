import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaClient, Subscription, User } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  mapDateFilterToPrisma,
  monthlyAmountFromPeriodAmount,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { SubscriptionDataloader } from './subscription.dataloader';
import {
  CancelPublicSubscriptionInput,
  CorrectSubscriptionPeriodArgs,
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
  InvoiceWithItems,
  PAYMENT_METHOD_CONFIG,
  PaymentMethodConfig,
} from '@wepublish/payment/api';
import { FeaturesService } from '@wepublish/features/api';
import { InvoiceDeliveryService } from '../periodic-job/invoice-delivery.service';
import { SubscriptionWithRelations } from '../legacy/member-context';
import { mapSubscriptionsAsCsv } from './subscription-as-csv';
import { legacySubscriptionWhere } from './legacy-subscription';

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaClient,
    private memberContext: MemberContextService,
    @Inject(PAYMENT_METHOD_CONFIG)
    private paymentMethodConfig: PaymentMethodConfig,
    private features: FeaturesService,
    private invoiceDelivery: InvoiceDeliveryService
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
        properties: properties as any,
      },
      include: {
        deactivation: true,
        periods: true,
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
        memberPlan: true,
        user: {
          include: { address: true, paymentProviderCustomers: true },
        },
        paymentMethod: true,
        invoices: {
          include: {
            items: {
              include: {
                goodie: true,
              },
            },
          },
        },
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
  async importSubscription(input: ImportPublicSubscriptionInput) {
    const { subscription } = await this.memberContext.importSubscription(input);

    return subscription;
  }

  @PrimeDataLoader(SubscriptionDataloader)
  async cancelSubscription({
    id,
    reason,
    skipMail,
  }: CancelPublicSubscriptionInput) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        deactivation: true,
        periods: true,
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
      skipMail,
    });
  }

  @PrimeDataLoader(SubscriptionDataloader)
  async reactivateSubscription(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        deactivation: true,
        periods: true,
        user: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with id ${id} was not found.`);
    }

    if (!subscription.deactivation) {
      throw new BadRequestException('Subscription is not deactivated');
    }

    await this.prisma.subscriptionDeactivation.delete({
      where: { subscriptionID: id },
    });

    const reactivatedSubscription = {
      ...subscription,
      deactivation: null,
    };

    // Deactivating cancels the open invoices, so a subscription whose period
    // has run out needs a new invoice to be payable again.
    const isPaid =
      subscription.paidUntil && subscription.paidUntil > new Date();

    if (!isPaid) {
      const invoice = await this.memberContext.renewSubscriptionForUser({
        subscription: reactivatedSubscription as SubscriptionWithRelations,
      });

      await this.deliverEditorInvoice(reactivatedSubscription, invoice);
    }

    return reactivatedSubscription;
  }

  /**
   * Data correction for a subscription sold or imported with the wrong terms,
   * e.g. a three-issue trial that runs as a year. The period keeps its start,
   * its invoice and its price and gets the periodicity and end it should have
   * had; the subscription follows, so the next renewal and everything that
   * goes by the period (the print export above all) see the same terms.
   *
   * Only for the latest period, paid, of a running subscription without an
   * open invoice: nothing here creates, cancels or sends anything.
   */
  @PrimeDataLoader(SubscriptionDataloader)
  async correctSubscriptionPeriod({
    subscriptionId,
    periodId,
    paymentPeriodicity,
    endsAt,
  }: CorrectSubscriptionPeriodArgs) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { deactivation: true, periods: true, invoices: true },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id ${subscriptionId} was not found.`
      );
    }

    if (subscription.deactivation) {
      throw new BadRequestException(
        'The period of a deactivated subscription can not be corrected.'
      );
    }

    const period = subscription.periods.find(({ id }) => id === periodId);

    if (!period) {
      throw new NotFoundException(
        `Period ${periodId} does not belong to subscription ${subscriptionId}.`
      );
    }

    if (subscription.periods.some(other => other.endsAt > period.endsAt)) {
      throw new BadRequestException(
        'Only the latest period of a subscription can be corrected.'
      );
    }

    const invoice = subscription.invoices.find(
      ({ id }) => id === period.invoiceID
    );

    if (!invoice?.paidAt || invoice.canceledAt) {
      throw new BadRequestException(
        'Only a paid period can be corrected.'
      );
    }

    if (
      subscription.invoices.some(
        ({ paidAt, canceledAt }) => !paidAt && !canceledAt
      )
    ) {
      throw new BadRequestException(
        'The subscription has an open invoice; settle or cancel it first.'
      );
    }

    if (endsAt <= period.startsAt) {
      throw new BadRequestException(
        'The period has to end after it starts.'
      );
    }

    // paidUntil follows only where it was this period's end; an editor may
    // have set it to something else on purpose.
    const paidUntilWasPeriodEnd =
      subscription.paidUntil?.getTime() === period.endsAt.getTime();

    const [, corrected] = await this.prisma.$transaction([
      this.prisma.subscriptionPeriod.update({
        where: { id: period.id },
        data: { paymentPeriodicity, endsAt },
      }),
      this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          paymentPeriodicity,
          monthlyAmount: monthlyAmountFromPeriodAmount(
            period.amount,
            paymentPeriodicity
          ),
          ...(paidUntilWasPeriodEnd ? { paidUntil: endsAt } : {}),
        },
        include: { deactivation: true, periods: true },
      }),
    ]);

    return corrected;
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
        user: true,
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

    const invoice = await this.memberContext.renewSubscriptionForUser({
      subscription,
    });

    await this.deliverEditorInvoice(subscription, invoice);

    return subscription;
  }

  /**
   * With `editor-renewal-provider-invoice`, an invoice an editor created is
   * handled like the nightly job's: created at the payment provider, kept as
   * a payment, mailed or printed. Without it the invoice exists in we.publish
   * only, as before.
   */
  private async deliverEditorInvoice(
    subscription: Subscription & { user: User },
    invoice: InvoiceWithItems | null
  ) {
    if (
      !invoice ||
      !(await this.features.isEnabled('editor-renewal-provider-invoice'))
    ) {
      return;
    }

    await this.invoiceDelivery.deliverRenewal(subscription, invoice);
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

const createActiveAtFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => {
  if (filter?.activeAt) {
    const activeAt = filter.activeAt;

    return {
      startsAt: {
        lte: activeAt,
      },
      paidUntil: {
        gte: activeAt,
      },
      OR: [
        { deactivation: { is: null } },
        {
          deactivation: {
            is: {
              date: {
                gte: activeAt,
              },
            },
          },
        },
      ],
    };
  }

  return {};
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

const createLegacyFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput =>
  filter?.legacy == null ? {} : legacySubscriptionWhere(filter.legacy);

export const createSubscriptionFilter = (
  filter: Partial<SubscriptionFilter>
): Prisma.SubscriptionWhereInput => ({
  AND: [
    createActiveAtFilter(filter),
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
    createLegacyFilter(filter),
  ],
});
