import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  NewsletterListLockedDisplay,
  NewsletterSubscriberSource,
  PrismaClient,
} from '@prisma/client';
import { createMock, PartialMocked } from '@wepublish/testing';
import { NewsletterSubscriberAdminService } from './newsletter-subscriber-admin.service';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';
import { NewsletterSubscriberStatus } from './newsletter-subscriber.model';

const now = new Date('2026-06-15T12:00:00.000Z');

const mockList = (overrides: Record<string, unknown> = {}) => ({
  id: 'list-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Members only',
  slug: 'members-only',
  description: null,
  active: true,
  requiresSubscription: false,
  anyMemberPlan: false,
  autoSubscribe: true,
  lockedDisplay: NewsletterListLockedDisplay.teaser,
  lockedText: null,
  lockedLinkUrl: null,
  memberPlans: [],
  ...overrides,
});

const mockRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'row-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  userId: 'user-1',
  listId: 'list-1',
  source: NewsletterSubscriberSource.self,
  subscribedAt: new Date('2026-01-01'),
  confirmedAt: new Date('2026-01-01'),
  unsubscribedAt: null,
  user: { active: true },
  ...overrides,
});

const activeSubscription = {
  memberPlanID: 'plan-a',
  confirmed: true,
  startsAt: new Date('2026-01-01'),
  paidUntil: new Date('2027-01-01'),
  gracePeriod: 0,
};

describe('NewsletterSubscriberAdminService', () => {
  let service: NewsletterSubscriberAdminService;
  let eligibility: PartialMocked<NewsletterEligibilityService>;
  let prismaMock: {
    newsletterList: { findUnique: jest.Mock };
    newsletterSubscriber: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      newsletterList: { findUnique: jest.fn().mockResolvedValue(mockList()) },
      newsletterSubscriber: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    eligibility = createMock(NewsletterEligibilityService);
    eligibility.subscriptionsByUser?.mockResolvedValue(new Map());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterSubscriberAdminService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: NewsletterEligibilityService, useValue: eligibility },
      ],
    }).compile();

    service = module.get(NewsletterSubscriberAdminService);
  });

  describe('listSubscribers', () => {
    it('filters by status and searches name and email', async () => {
      await service.listSubscribers(
        'list-1',
        { status: NewsletterSubscriberStatus.PENDING, q: 'anna' },
        10,
        20
      );

      const where = {
        listId: 'list-1',
        unsubscribedAt: null,
        confirmedAt: null,
        user: {
          OR: [
            { email: { contains: 'anna', mode: 'insensitive' } },
            { name: { contains: 'anna', mode: 'insensitive' } },
            { firstName: { contains: 'anna', mode: 'insensitive' } },
          ],
        },
      };

      expect(prismaMock.newsletterSubscriber.findMany).toHaveBeenCalledWith({
        where,
        include: { user: { select: { active: true } } },
        orderBy: { subscribedAt: 'desc' },
        take: 10,
        skip: 20,
      });
      expect(prismaMock.newsletterSubscriber.count).toHaveBeenCalledWith({
        where,
      });
    });

    it('filters confirmed and unsubscribed entries', async () => {
      await service.listSubscribers(
        'list-1',
        { status: NewsletterSubscriberStatus.SUBSCRIBED },
        10,
        0
      );
      await service.listSubscribers(
        'list-1',
        { status: NewsletterSubscriberStatus.UNSUBSCRIBED },
        10,
        0
      );

      expect(prismaMock.newsletterSubscriber.count).toHaveBeenNthCalledWith(1, {
        where: {
          listId: 'list-1',
          unsubscribedAt: null,
          confirmedAt: { not: null },
        },
      });
      expect(prismaMock.newsletterSubscriber.count).toHaveBeenNthCalledWith(2, {
        where: { listId: 'list-1', unsubscribedAt: { not: null } },
      });
    });

    it('returns the page with status, receiving flag and page info', async () => {
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
        mockRow(),
        mockRow({ id: 'row-2', userId: 'user-2', confirmedAt: null }),
      ]);
      prismaMock.newsletterSubscriber.count.mockResolvedValue(3);

      const result = await service.listSubscribers('list-1', {}, 2, 0);

      expect(result.totalCount).toBe(3);
      expect(result.pageInfo).toEqual({
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'row-1',
        endCursor: 'row-2',
      });
      expect(
        result.nodes.map(({ id, status, receiving }) => ({
          id,
          status,
          receiving,
        }))
      ).toEqual([
        {
          id: 'row-1',
          status: NewsletterSubscriberStatus.SUBSCRIBED,
          receiving: true,
        },
        {
          id: 'row-2',
          status: NewsletterSubscriberStatus.PENDING,
          receiving: false,
        },
      ]);
    });

    it('marks subscribers of a subscriber-only list without a qualifying subscription as not receiving', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(
        mockList({
          requiresSubscription: true,
          memberPlans: [{ memberPlanId: 'plan-a' }],
        })
      );
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
        mockRow(),
        mockRow({ id: 'row-2', userId: 'user-2' }),
      ]);
      eligibility.subscriptionsByUser?.mockResolvedValue(
        new Map([['user-2', [activeSubscription]]])
      );

      const result = await service.listSubscribers('list-1', {}, 10, 0);

      expect(eligibility.subscriptionsByUser).toHaveBeenCalledWith([
        'user-1',
        'user-2',
      ]);
      expect(result.nodes.map(({ receiving }) => receiving)).toEqual([
        false,
        true,
      ]);
    });

    it('marks inactive users as not receiving', async () => {
      prismaMock.newsletterSubscriber.findMany.mockResolvedValue([
        mockRow({ user: { active: false } }),
      ]);

      const result = await service.listSubscribers('list-1', {}, 10, 0);

      expect(result.nodes[0].receiving).toBe(false);
    });

    it('throws for an unknown list', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(null);

      await expect(
        service.listSubscribers('missing', {}, 10, 0)
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('countSubscribers', () => {
    it('counts subscribed, pending and unsubscribed entries', async () => {
      prismaMock.newsletterSubscriber.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      await expect(service.countSubscribers('list-1')).resolves.toEqual({
        subscribed: 5,
        pending: 2,
        unsubscribed: 1,
      });
    });
  });

  describe('getSubscriber', () => {
    it('returns null when the user has no entry', async () => {
      await expect(
        service.getSubscriber('list-1', 'user-1')
      ).resolves.toBeNull();
    });

    it('returns the entry with its status', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(
        mockRow({ unsubscribedAt: new Date('2026-03-01') })
      );

      const result = await service.getSubscriber('list-1', 'user-1');

      expect(prismaMock.newsletterSubscriber.findUnique).toHaveBeenCalledWith({
        where: { userId_listId: { userId: 'user-1', listId: 'list-1' } },
        include: { user: { select: { active: true } } },
      });
      expect(result?.status).toBe(NewsletterSubscriberStatus.UNSUBSCRIBED);
    });
  });

  describe('addByEditor', () => {
    it('adds a new subscriber as confirmed without double opt-in', async () => {
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(
        mockRow({ source: NewsletterSubscriberSource.editor })
      );

      const result = await service.addByEditor('list-1', 'user-1', false);

      expect(prismaMock.newsletterSubscriber.upsert).toHaveBeenCalledWith({
        where: { userId_listId: { userId: 'user-1', listId: 'list-1' } },
        create: {
          userId: 'user-1',
          listId: 'list-1',
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
        include: { user: { select: { active: true } } },
      });
      expect(result.status).toBe(NewsletterSubscriberStatus.SUBSCRIBED);
    });

    it('keeps who subscribed a user and when if they are already on the list', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(mockRow());

      const result = await service.addByEditor('list-1', 'user-1', false);

      expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
      expect(result.source).toBe(NewsletterSubscriberSource.self);
      expect(result.subscribedAt).toEqual(new Date('2026-01-01'));
      expect(result.status).toBe(NewsletterSubscriberStatus.SUBSCRIBED);
    });

    it('refuses to re-add someone who unsubscribed unless forced', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(
        mockRow({ unsubscribedAt: new Date('2026-03-01') })
      );

      await expect(
        service.addByEditor('list-1', 'user-1', false)
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.newsletterSubscriber.upsert).not.toHaveBeenCalled();
    });

    it('re-adds someone who unsubscribed when forced', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(
        mockRow({ unsubscribedAt: new Date('2026-03-01') })
      );
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(mockRow());

      await service.addByEditor('list-1', 'user-1', true);

      expect(prismaMock.newsletterSubscriber.upsert).toHaveBeenCalled();
    });

    it('allows adding someone without a qualifying subscription to a subscriber-only list', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(
        mockList({ requiresSubscription: true, anyMemberPlan: true })
      );
      prismaMock.newsletterSubscriber.upsert.mockResolvedValue(mockRow());

      const result = await service.addByEditor('list-1', 'user-1', false);

      expect(result.status).toBe(NewsletterSubscriberStatus.SUBSCRIBED);
      expect(result.receiving).toBe(false);
    });

    it('throws for an unknown list', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(null);

      await expect(
        service.addByEditor('missing', 'user-1', false)
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('removeByEditor', () => {
    it('marks the entry as unsubscribed and keeps it', async () => {
      prismaMock.newsletterSubscriber.findUnique.mockResolvedValue(mockRow());
      prismaMock.newsletterSubscriber.update.mockResolvedValue(
        mockRow({ unsubscribedAt: now })
      );

      const result = await service.removeByEditor('list-1', 'user-1');

      expect(prismaMock.newsletterSubscriber.update).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        data: { unsubscribedAt: now },
        include: { user: { select: { active: true } } },
      });
      expect(result.status).toBe(NewsletterSubscriberStatus.UNSUBSCRIBED);
    });

    it('throws when the user is not on the list', async () => {
      await expect(
        service.removeByEditor('list-1', 'user-1')
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
