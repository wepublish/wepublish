import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Subscription, User } from '@prisma/client';
import {
  DEFAULT_ENDED_WITHIN_DAYS,
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
    return (
      audience.base === MailRecipientBase.hasSubscription ||
      // Win-back mails are bound to the subscription that ended, so they can
      // name the plan the recipient used to have.
      audience.base === MailRecipientBase.endedSubscription
    );
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

      case MailRecipientBase.endedSubscription:
        return this.prisma.subscription.count({
          where: this.buildEndedSubscriptionWhere(audience),
        });
    }
  }

  /**
   * How many distinct people the audience reaches. Differs from {@link count}
   * for subscription-based audiences, where someone with two matching
   * subscriptions is two recipients — and receives two mails.
   */
  async countUsers(audience: MailAudienceInput): Promise<number> {
    switch (audience.base) {
      case MailRecipientBase.allUsers:
        return this.prisma.user.count();

      case MailRecipientBase.noActiveSubscription:
        return this.prisma.user.count({
          where: this.buildNoActiveSubscriptionWhere(),
        });

      case MailRecipientBase.hasSubscription:
        return this.prisma.user.count({
          where: {
            subscriptions: { some: this.buildSubscriptionWhere(audience) },
          },
        });

      case MailRecipientBase.endedSubscription:
        return this.prisma.user.count({
          where: {
            subscriptions: { some: this.buildEndedSubscriptionWhere(audience) },
          },
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

      case MailRecipientBase.endedSubscription: {
        const subscriptions = await this.prisma.subscription.findMany({
          where: this.buildEndedSubscriptionWhere(audience),
          include: { ...subscriptionInclude, user: true },
          skip,
          take,
          // Most recently ended first: those are the likeliest to come back.
          orderBy: { paidUntil: 'desc' },
        });

        return subscriptions
          .filter(subscription => subscription.user)
          .map(({ user, ...subscription }) => ({
            user: user as User,
            subscription: subscription as SubscriptionWithRelations,
          }));
      }
    }
  }

  /**
   * The period an ended subscription must fall into: either an explicit range
   * the editor picked, or a rolling window of the last N days.
   */
  private endedWindow(audience: MailAudienceInput): { from: Date; to: Date } {
    const now = new Date();

    if (audience.endedFrom || audience.endedTo) {
      return {
        from: audience.endedFrom ? new Date(audience.endedFrom) : new Date(0),
        to: audience.endedTo ? new Date(audience.endedTo) : now,
      };
    }

    const days = audience.endedWithinDays ?? DEFAULT_ENDED_WITHIN_DAYS;

    return {
      from: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
      to: now,
    };
  }

  /**
   * Subscriptions that ended inside the look-back window and whose owner has
   * not subscribed again — the win-back audience.
   *
   * A subscription has ended exactly when it carries a deactivation: every path
   * writes one (user cancels, invoice unpaid, or the periodic job sweeping up
   * expired non-renewing subscriptions), and the date it records is the day the
   * subscription actually ran out, not the day the record was written. So the
   * deactivation date is what the window is matched against.
   *
   * Deliberately NOT included: a subscription that is merely past `paidUntil`.
   * Either it still auto-renews — then it is in collection and its owner never
   * left — or the periodic job turns it into a deactivation dated at
   * `paidUntil`, which this filter then finds in the very same window.
   */
  private buildEndedSubscriptionWhere(
    audience: MailAudienceInput
  ): Prisma.SubscriptionWhereInput {
    const { from, to } = this.endedWindow(audience);

    const and: Prisma.SubscriptionWhereInput[] = [
      { deactivation: { date: { gte: from, lte: to } } },
      // A signup that was never confirmed is not a lost customer.
      { confirmed: true },
      // Someone who resubscribed in the meantime is already won back.
      {
        user: {
          subscriptions: {
            none: this.subscriptionStateWhere(MailSubscriptionState.active),
          },
        },
      },
    ];

    if (audience.memberPlanIDs?.length) {
      and.push({ memberPlanID: { in: audience.memberPlanIDs } });
    }

    if (audience.paymentMethodID) {
      and.push({ paymentMethodID: audience.paymentMethodID });
    }

    if (audience.paymentPeriodicity) {
      and.push({ paymentPeriodicity: audience.paymentPeriodicity });
    }

    return { AND: and };
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
