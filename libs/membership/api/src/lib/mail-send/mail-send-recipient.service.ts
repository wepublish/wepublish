import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Subscription, User } from '@prisma/client';
import {
  MailAudienceInput,
  MailRecipientBase,
  MailSubscriptionState,
} from './mail-send.model';

export type SubscriptionWithRelations = Subscription & {
  memberPlan?: unknown;
  paymentMethod?: unknown;
  deactivation?: unknown;
  periods?: unknown;
};

export interface MailRecipient {
  user: User;
  subscription?: SubscriptionWithRelations;
}

const subscriptionInclude = {
  memberPlan: true,
  paymentMethod: true,
  deactivation: true,
  periods: true,
} satisfies Prisma.SubscriptionInclude;

/**
 * Resolves a manual-send audience into concrete recipients and counts.
 *
 * Dedup rule: a `hasSubscription` audience yields one recipient per matching
 * subscription (each bound to that subscription's data). Every other base
 * yields one recipient per user (subscription is undefined).
 */
@Injectable()
export class MailSendRecipientService {
  constructor(private prisma: PrismaClient) {}

  /** Whether recipients of this audience carry subscription data. */
  allowsSubscriptionTemplates(audience: MailAudienceInput): boolean {
    return audience.base === MailRecipientBase.hasSubscription;
  }

  async count(audience: MailAudienceInput): Promise<number> {
    switch (audience.base) {
      case MailRecipientBase.allUsers:
        return this.prisma.user.count();

      case MailRecipientBase.hasSubscription:
        return this.prisma.subscription.count({
          where: this.buildSubscriptionWhere(audience),
        });

      case MailRecipientBase.noActiveSubscription:
        return this.prisma.user.count({
          where: this.buildNoActiveSubscriptionWhere(),
        });
    }
  }

  async resolvePage(
    audience: MailAudienceInput,
    skip: number,
    take: number
  ): Promise<MailRecipient[]> {
    switch (audience.base) {
      case MailRecipientBase.allUsers: {
        const users = await this.prisma.user.findMany({
          skip,
          take,
          orderBy: { createdAt: 'asc' },
        });

        return users.map(user => ({ user }));
      }

      case MailRecipientBase.hasSubscription: {
        const subscriptions = await this.prisma.subscription.findMany({
          where: this.buildSubscriptionWhere(audience),
          include: { ...subscriptionInclude, user: true },
          skip,
          take,
          orderBy: { createdAt: 'asc' },
        });

        return subscriptions
          .filter(subscription => subscription.user)
          .map(({ user, ...subscription }) => ({
            user: user as User,
            subscription: subscription as SubscriptionWithRelations,
          }));
      }

      case MailRecipientBase.noActiveSubscription: {
        const users = await this.prisma.user.findMany({
          where: this.buildNoActiveSubscriptionWhere(),
          skip,
          take,
          orderBy: { createdAt: 'asc' },
        });

        return users.map(user => ({ user }));
      }
    }
  }

  private buildSubscriptionWhere(
    audience: MailAudienceInput
  ): Prisma.SubscriptionWhereInput {
    const and: Prisma.SubscriptionWhereInput[] = [];

    if (audience.memberPlanIDs) {
      and.push({
        memberPlanID: {
          in:
            audience.memberPlanIDs.length > 0 ?
              audience.memberPlanIDs
            : ['___none___'],
        },
      });
    }

    if (audience.subscriptionState) {
      and.push(this.subscriptionStateWhere(audience.subscriptionState));
    }

    if (audience.autoRenew != null) {
      and.push({ autoRenew: audience.autoRenew });
    }

    if (audience.paymentMethodID) {
      and.push({ paymentMethodID: audience.paymentMethodID });
    }

    if (audience.paymentPeriodicity) {
      and.push({ paymentPeriodicity: audience.paymentPeriodicity });
    }

    return and.length ? { AND: and } : {};
  }

  private subscriptionStateWhere(
    state: MailSubscriptionState
  ): Prisma.SubscriptionWhereInput {
    switch (state) {
      case MailSubscriptionState.active:
        return {
          confirmed: true,
          deactivation: { is: null },
          OR: [{ paidUntil: null }, { paidUntil: { gte: new Date() } }],
        };

      case MailSubscriptionState.pending:
        return { confirmed: false };

      case MailSubscriptionState.deactivated:
        return { deactivation: { isNot: null } };
    }
  }

  /** Users with no active subscription (may have expired / cancelled ones). */
  private buildNoActiveSubscriptionWhere(): Prisma.UserWhereInput {
    return {
      subscriptions: {
        none: this.subscriptionStateWhere(MailSubscriptionState.active),
      },
    };
  }
}
