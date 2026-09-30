import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NewsletterSubscriberSource,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { splitEvery } from 'ramda';
import {
  CreateNewsletterListInput,
  UpdateNewsletterListInput,
} from './newsletter-list.model';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';
import { EligibilityList } from './newsletter-eligibility';

const BACKFILL_CHUNK_SIZE = 1000;

const assertValidAccess = ({
  requiresSubscription,
  anyMemberPlan,
  memberPlanIds,
}: EligibilityList) => {
  if (requiresSubscription && !anyMemberPlan && !memberPlanIds.length) {
    throw new BadRequestException(
      'A subscriber-only newsletter list needs at least one member plan or must allow any member plan.'
    );
  }
};

@Injectable()
export class NewsletterListService {
  constructor(
    private prisma: PrismaClient,
    private eligibility: NewsletterEligibilityService
  ) {}

  list() {
    return this.prisma.newsletterList.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const list = await this.prisma.newsletterList.findUnique({
      where: { id },
    });

    if (!list) {
      throw new NotFoundException(`Newsletter list with id ${id} not found`);
    }

    return list;
  }

  async create({ memberPlanIds = [], ...input }: CreateNewsletterListInput) {
    assertValidAccess({
      requiresSubscription: input.requiresSubscription ?? false,
      anyMemberPlan: input.anyMemberPlan ?? false,
      memberPlanIds,
    });

    return this.withReadableSlugConflict(input.slug, () =>
      this.prisma.newsletterList.create({
        data: {
          ...input,
          memberPlans: {
            createMany: {
              data: memberPlanIds.map(memberPlanId => ({ memberPlanId })),
            },
          },
        },
      })
    );
  }

  async update({ id, memberPlanIds, ...input }: UpdateNewsletterListInput) {
    const existing = await this.prisma.newsletterList.findUnique({
      where: { id },
      include: { memberPlans: true },
    });

    if (!existing) {
      throw new NotFoundException(`Newsletter list with id ${id} not found`);
    }

    assertValidAccess({
      requiresSubscription:
        input.requiresSubscription ?? existing.requiresSubscription,
      anyMemberPlan: input.anyMemberPlan ?? existing.anyMemberPlan,
      memberPlanIds:
        memberPlanIds ??
        existing.memberPlans.map(({ memberPlanId }) => memberPlanId),
    });

    return this.withReadableSlugConflict(input.slug ?? existing.slug, () =>
      this.prisma.newsletterList.update({
        where: { id },
        data: {
          ...input,
          memberPlans:
            memberPlanIds ?
              {
                deleteMany: { memberPlanId: { notIn: memberPlanIds } },
                createMany: {
                  skipDuplicates: true,
                  data: memberPlanIds.map(memberPlanId => ({ memberPlanId })),
                },
              }
            : undefined,
        },
      })
    );
  }

  delete(id: string) {
    return this.prisma.newsletterList.delete({ where: { id } });
  }

  async backfill(id: string): Promise<number> {
    const list = await this.prisma.newsletterList.findUnique({
      where: { id },
      include: { memberPlans: true },
    });

    if (!list) {
      throw new NotFoundException(`Newsletter list with id ${id} not found`);
    }

    if (!list.requiresSubscription) {
      throw new BadRequestException(
        'Only subscriber-only newsletter lists can be filled with the current subscribers.'
      );
    }

    const userIds = await this.eligibility.eligibleUserIds({
      requiresSubscription: true,
      anyMemberPlan: list.anyMemberPlan,
      memberPlanIds: list.memberPlans.map(({ memberPlanId }) => memberPlanId),
    });

    const now = new Date();
    let added = 0;

    for (const chunk of splitEvery(BACKFILL_CHUNK_SIZE, userIds)) {
      const { count } = await this.prisma.newsletterSubscriber.createMany({
        skipDuplicates: true,
        data: chunk.map(userId => ({
          userId,
          listId: id,
          source: NewsletterSubscriberSource.auto,
          subscribedAt: now,
          confirmedAt: now,
        })),
      });

      added += count;
    }

    return added;
  }

  private async withReadableSlugConflict<T>(
    slug: string,
    query: () => Promise<T>
  ): Promise<T> {
    try {
      return await query();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `A newsletter list with the slug "${slug}" already exists.`
        );
      }

      throw error;
    }
  }
}
