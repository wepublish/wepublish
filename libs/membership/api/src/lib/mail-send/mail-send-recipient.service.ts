import { Injectable } from '@nestjs/common';
import {
  MailChannel,
  Prisma,
  PrismaClient,
  Subscription,
} from '@prisma/client';
import { UserWithAddress } from '@wepublish/letter/api';
import {
  DEFAULT_ENDED_WITHIN_DAYS,
  MailAudienceInput,
  MailEmailFilter,
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
  /**
   * Loaded with its address throughout: a letter send needs it, and it is one
   * small relation rather than a second code path through every audience.
   */
  user: UserWithAddress;
  subscription?: SubscriptionWithRelations;
}

/** A materialised queue row, reduced to what identifies its recipient. */
export interface QueuedRecipientRef {
  userId: string;
  subscriptionId?: string | null;
}

/** Key a recipient is looked up by: one user, optionally one subscription. */
export const recipientKey = ({
  userId,
  subscriptionId,
}: QueuedRecipientRef): string => `${userId}:${subscriptionId ?? ''}`;

const subscriptionInclude = {
  memberPlan: true,
  paymentMethod: true,
  deactivation: true,
  periods: true,
} satisfies Prisma.SubscriptionInclude;

const userInclude = { address: true } satisfies Prisma.UserInclude;

/** A field that is either unset or empty. */
const blank = (field: keyof Prisma.UserAddressWhereInput) => [
  { [field]: null },
  { [field]: '' },
];

/**
 * Users a letter could not be addressed to, as far as the database can tell:
 * no address at all, or one missing a street, a zip, a city or a country.
 */
const WITHOUT_ADDRESS: Prisma.UserWhereInput = {
  OR: [
    { address: { is: null } },
    {
      address: {
        is: {
          OR: [
            ...blank('zipCode'),
            ...blank('city'),
            ...blank('country'),
            {
              AND: [
                { OR: blank('streetAddress') },
                { OR: blank('streetAddress2') },
              ],
            },
          ],
        },
      },
    },
  ],
};

const withUser = (
  where: Prisma.UserWhereInput,
  email: Prisma.UserWhereInput | null
): Prisma.UserWhereInput => (email ? { AND: [where, email] } : where);

const withSubscriptionUser = (
  where: Prisma.SubscriptionWhereInput,
  email: Prisma.UserWhereInput | null
): Prisma.SubscriptionWhereInput =>
  email ? { AND: [where, { user: email }] } : where;

/**
 * Resolves a manual-send audience into concrete recipients and counts.
 *
 * Dedup rule: a subscription-based audience yields one recipient per matching
 * subscription (each bound to that subscription's data). Every other base
 * yields one recipient per user (subscription is undefined).
 *
 * A letter send collapses that to one recipient per person whatever the base
 * is: two sheets of paper in the same letterbox saying the same thing are waste,
 * where two mails in the same inbox are at worst noise. The recipient still
 * carries a subscription — the first match — so subscription placeholders keep
 * working.
 */
@Injectable()
export class MailSendRecipientService {
  constructor(private prisma: PrismaClient) {}

  /**
   * How many recipients of an audience a letter send would skip for lack of a
   * postal address. Deliberately a single count over the obviously missing
   * fields rather than {@link canReceiveLetters} over every row: this is a
   * warning shown while the audience is still being edited, and it re-runs on
   * every change. The send itself applies the real check, so a recipient whose
   * address is present but unusable (an unrecognised country, say) is missing
   * from this number and shows up in the log instead.
   */
  async countWithoutAddress(
    audience: MailAudienceInput,
    channel?: MailChannel | null
  ): Promise<number> {
    const email = await this.buildEmailWhere(audience);

    if (this.oncePerUser(channel)) {
      return this.prisma.user.count({
        where: withUser(
          { AND: [this.buildUserWhere(audience), WITHOUT_ADDRESS] },
          email
        ),
      });
    }

    switch (audience.base) {
      case MailRecipientBase.allUsers:
        return this.prisma.user.count({
          where: withUser(WITHOUT_ADDRESS, email),
        });

      case MailRecipientBase.noActiveSubscription:
        return this.prisma.user.count({
          where: withUser(
            { AND: [this.buildNoActiveSubscriptionWhere(), WITHOUT_ADDRESS] },
            email
          ),
        });

      // Subscription audiences are counted per subscription, like `count`:
      // someone with two matching subscriptions would be skipped twice.
      case MailRecipientBase.hasSubscription:
        return this.prisma.subscription.count({
          where: {
            AND: [
              this.buildSubscriptionWhere(audience),
              { user: withUser(WITHOUT_ADDRESS, email) },
            ],
          },
        });

      case MailRecipientBase.endedSubscription:
        return this.prisma.subscription.count({
          where: {
            AND: [
              this.buildEndedSubscriptionWhere(audience),
              { user: withUser(WITHOUT_ADDRESS, email) },
            ],
          },
        });
    }
  }

  /** Whether a send over this channel reaches every person exactly once. */
  oncePerUser(channel?: MailChannel | null): boolean {
    return channel === MailChannel.letter;
  }

  /** Whether recipients of this audience carry subscription data. */
  allowsSubscriptionTemplates(audience: MailAudienceInput): boolean {
    return (
      audience.base === MailRecipientBase.hasSubscription ||
      // Win-back mails are bound to the subscription that ended, so they can
      // name the plan the recipient used to have.
      audience.base === MailRecipientBase.endedSubscription
    );
  }

  async count(
    audience: MailAudienceInput,
    channel?: MailChannel | null
  ): Promise<number> {
    if (this.oncePerUser(channel)) {
      return this.countUsers(audience);
    }

    const email = await this.buildEmailWhere(audience);

    switch (audience.base) {
      case MailRecipientBase.allUsers:
        return email ?
            this.prisma.user.count({ where: email })
          : this.prisma.user.count();

      case MailRecipientBase.hasSubscription:
        return this.prisma.subscription.count({
          where: withSubscriptionUser(
            this.buildSubscriptionWhere(audience),
            email
          ),
        });

      case MailRecipientBase.noActiveSubscription:
        return this.prisma.user.count({
          where: withUser(this.buildNoActiveSubscriptionWhere(), email),
        });

      case MailRecipientBase.endedSubscription:
        return this.prisma.subscription.count({
          where: withSubscriptionUser(
            this.buildEndedSubscriptionWhere(audience),
            email
          ),
        });
    }
  }

  /**
   * How many distinct people the audience reaches. Differs from {@link count}
   * for subscription-based audiences, where someone with two matching
   * subscriptions is two recipients — and receives two mails.
   */
  async countUsers(audience: MailAudienceInput): Promise<number> {
    const email = await this.buildEmailWhere(audience);

    if (audience.base === MailRecipientBase.allUsers && !email) {
      return this.prisma.user.count();
    }

    return this.prisma.user.count({
      where: withUser(this.buildUserWhere(audience), email),
    });
  }

  /**
   * The recipients behind already materialised queue rows. Loaded by id rather
   * than by re-running the audience, so a job continues with exactly the people
   * it was planned for even if the filter would match differently by now.
   *
   * Rows whose user or subscription has since been deleted are absent from the
   * result — the caller decides what to do with them.
   */
  async loadQueued(
    refs: QueuedRecipientRef[]
  ): Promise<Map<string, MailRecipient>> {
    const userIds = [...new Set(refs.map(({ userId }) => userId))];
    const subscriptionIds = [
      ...new Set(
        refs
          .map(({ subscriptionId }) => subscriptionId)
          .filter((id): id is string => !!id)
      ),
    ];

    const [users, subscriptions] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        include: userInclude,
      }),
      subscriptionIds.length ?
        this.prisma.subscription.findMany({
          where: { id: { in: subscriptionIds } },
          include: subscriptionInclude,
        })
      : Promise.resolve([]),
    ]);

    const usersById = new Map(users.map(user => [user.id, user]));
    const subscriptionsById = new Map(
      subscriptions.map(subscription => [subscription.id, subscription])
    );

    const recipients = new Map<string, MailRecipient>();

    for (const ref of refs) {
      const user = usersById.get(ref.userId);

      if (!user) {
        continue;
      }

      const subscription =
        ref.subscriptionId ?
          subscriptionsById.get(ref.subscriptionId)
        : undefined;

      if (ref.subscriptionId && !subscription) {
        continue;
      }

      recipients.set(recipientKey(ref), { user, subscription });
    }

    return recipients;
  }

  async resolvePage(
    audience: MailAudienceInput,
    skip: number,
    take: number,
    channel?: MailChannel | null
  ): Promise<MailRecipient[]> {
    const email = await this.buildEmailWhere(audience);

    if (this.oncePerUser(channel)) {
      return this.resolveUserPage(audience, email, skip, take);
    }

    switch (audience.base) {
      case MailRecipientBase.allUsers: {
        const users = await this.prisma.user.findMany({
          where: email ?? undefined,
          include: userInclude,
          skip,
          take,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        });

        return users.map(user => ({ user }));
      }

      case MailRecipientBase.hasSubscription: {
        const subscriptions = await this.prisma.subscription.findMany({
          where: withSubscriptionUser(
            this.buildSubscriptionWhere(audience),
            email
          ),
          include: {
            ...subscriptionInclude,
            user: { include: userInclude },
          },
          skip,
          take,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        });

        return subscriptions
          .filter(subscription => subscription.user)
          .map(({ user, ...subscription }) => ({
            user: user as UserWithAddress,
            subscription: subscription as SubscriptionWithRelations,
          }));
      }

      case MailRecipientBase.noActiveSubscription: {
        const users = await this.prisma.user.findMany({
          where: withUser(this.buildNoActiveSubscriptionWhere(), email),
          include: userInclude,
          skip,
          take,
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        });

        return users.map(user => ({ user }));
      }

      case MailRecipientBase.endedSubscription: {
        const subscriptions = await this.prisma.subscription.findMany({
          where: withSubscriptionUser(
            this.buildEndedSubscriptionWhere(audience),
            email
          ),
          include: {
            ...subscriptionInclude,
            user: { include: userInclude },
          },
          skip,
          take,
          // Most recently ended first: those are the likeliest to come back.
          orderBy: [{ paidUntil: 'desc' }, { id: 'asc' }],
        });

        return subscriptions
          .filter(subscription => subscription.user)
          .map(({ user, ...subscription }) => ({
            user: user as UserWithAddress,
            subscription: subscription as SubscriptionWithRelations,
          }));
      }
    }
  }

  /**
   * One recipient per person, in the same order the audience would otherwise
   * produce. Subscription-based audiences still bind a subscription — the
   * first one that matches — so the letter can name the plan.
   */
  private async resolveUserPage(
    audience: MailAudienceInput,
    email: Prisma.UserWhereInput | null,
    skip: number,
    take: number
  ): Promise<MailRecipient[]> {
    const include: Prisma.UserInclude = {
      ...userInclude,
      ...(this.subscriptionSelection(audience) ?? {}),
    };

    const users = (await this.prisma.user.findMany({
      where: withUser(this.buildUserWhere(audience), email),
      include,
      skip,
      take,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })) as (UserWithAddress & {
      subscriptions?: SubscriptionWithRelations[];
    })[];

    return users.map(({ subscriptions, ...user }) => ({
      user: user as UserWithAddress,
      subscription: subscriptions?.[0],
    }));
  }

  /**
   * The one matching subscription a per-person recipient is bound to, or
   * nothing at all for the bases that carry no subscription.
   */
  private subscriptionSelection(
    audience: MailAudienceInput
  ): Prisma.UserInclude | null {
    switch (audience.base) {
      case MailRecipientBase.allUsers:
      case MailRecipientBase.noActiveSubscription:
        return null;

      case MailRecipientBase.hasSubscription:
        return {
          subscriptions: {
            where: this.buildSubscriptionWhere(audience),
            include: subscriptionInclude,
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            take: 1,
          },
        };

      case MailRecipientBase.endedSubscription:
        return {
          subscriptions: {
            where: this.buildEndedSubscriptionWhere(audience),
            include: subscriptionInclude,
            // Most recently ended first, like the per-subscription page.
            orderBy: [{ paidUntil: 'desc' }, { id: 'asc' }],
            take: 1,
          },
        };
    }
  }

  private async buildEmailWhere(
    audience: MailAudienceInput
  ): Promise<Prisma.UserWhereInput | null> {
    if (!audience.emailFilter || audience.emailFilter === MailEmailFilter.all) {
      return null;
    }

    const settings = await this.prisma.settingLetterProvider.findMany({
      select: { placeholderEmailContains: true },
    });

    const patterns = settings
      .map(({ placeholderEmailContains }) => placeholderEmailContains?.trim())
      .filter((pattern): pattern is string => !!pattern);

    if (audience.emailFilter === MailEmailFilter.placeholder) {
      return {
        OR: patterns.map(pattern => ({
          email: { contains: pattern, mode: 'insensitive' },
        })),
      };
    }

    // The complement spelled out per pattern instead of `NOT`: `email` is
    // required, so there is no NULL case to lose.
    return {
      AND: patterns.map(pattern => ({
        email: { not: { contains: pattern, mode: 'insensitive' } },
      })),
    };
  }

  /** The audience expressed as a filter on people rather than subscriptions. */
  private buildUserWhere(audience: MailAudienceInput): Prisma.UserWhereInput {
    switch (audience.base) {
      case MailRecipientBase.allUsers:
        return {};

      case MailRecipientBase.noActiveSubscription:
        return this.buildNoActiveSubscriptionWhere();

      case MailRecipientBase.hasSubscription:
        return {
          subscriptions: { some: this.buildSubscriptionWhere(audience) },
        };

      case MailRecipientBase.endedSubscription:
        return {
          subscriptions: { some: this.buildEndedSubscriptionWhere(audience) },
        };
    }
  }

  /**
   * The period an ended subscription must fall into: either an explicit range
   * the editor picked, or a rolling window of the last N days.
   */
  private dateRange(from?: Date, to?: Date): Prisma.DateTimeFilter {
    const range: Prisma.DateTimeFilter = {};

    if (from) {
      range.gte = new Date(from);
    }

    if (to) {
      range.lte = new Date(to);
    }

    return range;
  }

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

    if (audience.startsAtFrom || audience.startsAtTo) {
      and.push({
        startsAt: this.dateRange(audience.startsAtFrom, audience.startsAtTo),
      });
    }

    if (audience.endsAtFrom || audience.endsAtTo) {
      const endsAt = this.dateRange(audience.endsAtFrom, audience.endsAtTo);

      and.push({
        OR: [
          { deactivation: { is: { date: endsAt } } },
          { deactivation: { is: null }, paidUntil: endsAt },
        ],
      });
    }

    if (audience.isPaid != null) {
      const now = new Date();
      const paidUp: Prisma.SubscriptionWhereInput = {
        startsAt: { lt: now },
        paidUntil: { gt: now },
      };
      const notPaidUp: Prisma.SubscriptionWhereInput = {
        OR: [
          { startsAt: { gte: now } },
          { paidUntil: null },
          { paidUntil: { lte: now } },
        ],
      };

      and.push(audience.isPaid ? paidUp : notPaidUp);
    }

    if (audience.isCanceled != null) {
      and.push({
        deactivation: audience.isCanceled ? { isNot: null } : { is: null },
      });
    }

    if (audience.hasReplacedSubscription != null) {
      and.push({
        replacesSubscriptionID:
          audience.hasReplacedSubscription ? { not: null } : { equals: null },
      });
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
