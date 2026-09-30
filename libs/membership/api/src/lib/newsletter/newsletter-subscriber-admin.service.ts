import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NewsletterList,
  NewsletterListMemberPlan,
  NewsletterSubscriber as PNewsletterSubscriber,
  NewsletterSubscriberSource,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { PaginatedObjectType } from '@wepublish/utils/api';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';
import {
  EligibilitySubscription,
  isEligibleForNewsletterList,
} from './newsletter-eligibility';
import {
  NewsletterSubscriber,
  NewsletterSubscriberCounts,
  NewsletterSubscriberFilter,
  NewsletterSubscriberStatus,
} from './newsletter-subscriber.model';

const includeUserActive = {
  user: { select: { active: true } },
} satisfies Prisma.NewsletterSubscriberInclude;

type SubscriberRow = PNewsletterSubscriber & { user: { active: boolean } };

type ListWithMemberPlans = NewsletterList & {
  memberPlans: NewsletterListMemberPlan[];
};

const statusWhere = (
  status?: NewsletterSubscriberStatus
): Prisma.NewsletterSubscriberWhereInput => {
  switch (status) {
    case NewsletterSubscriberStatus.SUBSCRIBED:
      return { unsubscribedAt: null, confirmedAt: { not: null } };
    case NewsletterSubscriberStatus.PENDING:
      return { unsubscribedAt: null, confirmedAt: null };
    case NewsletterSubscriberStatus.UNSUBSCRIBED:
      return { unsubscribedAt: { not: null } };
    default:
      return {};
  }
};

const searchWhere = (q?: string): Prisma.NewsletterSubscriberWhereInput =>
  q ?
    {
      user: {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
        ],
      },
    }
  : {};

const statusOf = ({ unsubscribedAt, confirmedAt }: PNewsletterSubscriber) => {
  if (unsubscribedAt) {
    return NewsletterSubscriberStatus.UNSUBSCRIBED;
  }

  return confirmedAt ?
      NewsletterSubscriberStatus.SUBSCRIBED
    : NewsletterSubscriberStatus.PENDING;
};

@Injectable()
export class NewsletterSubscriberAdminService {
  constructor(
    private prisma: PrismaClient,
    private eligibility: NewsletterEligibilityService
  ) {}

  async listSubscribers(
    listId: string,
    filter: NewsletterSubscriberFilter,
    take: number,
    skip: number
  ): Promise<PaginatedObjectType<NewsletterSubscriber>> {
    const list = await this.listWithMemberPlans(listId);
    const where: Prisma.NewsletterSubscriberWhereInput = {
      listId,
      ...statusWhere(filter.status),
      ...searchWhere(filter.q),
    };

    const [rows, totalCount] = await Promise.all([
      this.prisma.newsletterSubscriber.findMany({
        where,
        include: includeUserActive,
        orderBy: { subscribedAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.newsletterSubscriber.count({ where }),
    ]);

    const subscriptions = await this.eligibility.subscriptionsByUser(
      rows.map(({ userId }) => userId)
    );

    const nodes = rows.map(row =>
      this.toSubscriber(list, row, subscriptions.get(row.userId) ?? [])
    );

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage: skip > 0,
        hasNextPage: skip + nodes.length < totalCount,
        startCursor: nodes[0]?.id,
        endCursor: nodes[nodes.length - 1]?.id,
      },
    };
  }

  async countSubscribers(listId: string): Promise<NewsletterSubscriberCounts> {
    const [subscribed, pending, unsubscribed] = await Promise.all(
      [
        NewsletterSubscriberStatus.SUBSCRIBED,
        NewsletterSubscriberStatus.PENDING,
        NewsletterSubscriberStatus.UNSUBSCRIBED,
      ].map(status =>
        this.prisma.newsletterSubscriber.count({
          where: { listId, ...statusWhere(status) },
        })
      )
    );

    return { subscribed, pending, unsubscribed };
  }

  async getSubscriber(
    listId: string,
    userId: string
  ): Promise<NewsletterSubscriber | null> {
    const list = await this.listWithMemberPlans(listId);
    const row = await this.prisma.newsletterSubscriber.findUnique({
      where: { userId_listId: { userId, listId } },
      include: includeUserActive,
    });

    return row ? this.toSubscriberWithEligibility(list, row) : null;
  }

  async addByEditor(
    listId: string,
    userId: string,
    force: boolean
  ): Promise<NewsletterSubscriber> {
    const list = await this.listWithMemberPlans(listId);
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { userId_listId: { userId, listId } },
      include: includeUserActive,
    });

    if (existing?.confirmedAt && !existing.unsubscribedAt) {
      return this.toSubscriberWithEligibility(list, existing);
    }

    if (existing?.unsubscribedAt && !force) {
      throw new ConflictException(
        `This user unsubscribed from the newsletter list on ${existing.unsubscribedAt.toISOString()}.`
      );
    }

    const now = new Date();
    const row = await this.prisma.newsletterSubscriber.upsert({
      where: { userId_listId: { userId, listId } },
      create: {
        userId,
        listId,
        source: NewsletterSubscriberSource.editor,
        subscribedAt: now,
        confirmedAt: now,
      },
      update: {
        source: NewsletterSubscriberSource.editor,
        subscribedAt: now,
        confirmedAt: now,
        unsubscribedAt: null,
      },
      include: includeUserActive,
    });

    return this.toSubscriberWithEligibility(list, row);
  }

  async removeByEditor(
    listId: string,
    userId: string
  ): Promise<NewsletterSubscriber> {
    const list = await this.listWithMemberPlans(listId);
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { userId_listId: { userId, listId } },
    });

    if (!existing) {
      throw new NotFoundException('This user is not on the newsletter list.');
    }

    const row = await this.prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: { unsubscribedAt: existing.unsubscribedAt ?? new Date() },
      include: includeUserActive,
    });

    return this.toSubscriberWithEligibility(list, row);
  }

  private async listWithMemberPlans(
    listId: string
  ): Promise<ListWithMemberPlans> {
    const list = await this.prisma.newsletterList.findUnique({
      where: { id: listId },
      include: { memberPlans: true },
    });

    if (!list) {
      throw new NotFoundException(
        `Newsletter list with id ${listId} not found`
      );
    }

    return list;
  }

  private async toSubscriberWithEligibility(
    list: ListWithMemberPlans,
    row: SubscriberRow
  ) {
    const subscriptions = await this.eligibility.subscriptionsByUser([
      row.userId,
    ]);

    return this.toSubscriber(list, row, subscriptions.get(row.userId) ?? []);
  }

  private toSubscriber(
    list: ListWithMemberPlans,
    { user, ...row }: SubscriberRow,
    subscriptions: EligibilitySubscription[]
  ): NewsletterSubscriber {
    const status = statusOf(row);
    const eligible = isEligibleForNewsletterList(
      {
        requiresSubscription: list.requiresSubscription,
        anyMemberPlan: list.anyMemberPlan,
        memberPlanIds: list.memberPlans.map(({ memberPlanId }) => memberPlanId),
      },
      subscriptions
    );

    return {
      ...row,
      status,
      receiving:
        status === NewsletterSubscriberStatus.SUBSCRIBED &&
        list.active &&
        user.active &&
        eligible,
    };
  }
}
