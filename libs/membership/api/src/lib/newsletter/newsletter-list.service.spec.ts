import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  NewsletterListLockedDisplay,
  NewsletterSubscriberSource,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { createMock, PartialMocked } from '@wepublish/testing';
import { NewsletterListService } from './newsletter-list.service';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';

const mockList = (overrides: Record<string, unknown> = {}) => ({
  id: 'list-1',
  createdAt: new Date('2026-01-01'),
  modifiedAt: new Date('2026-01-01'),
  name: 'Morning Briefing',
  slug: 'morning-briefing',
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

describe('NewsletterListService', () => {
  let service: NewsletterListService;
  let eligibility: PartialMocked<NewsletterEligibilityService>;
  let prismaMock: {
    newsletterList: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    newsletterSubscriber: { createMany: jest.Mock };
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      newsletterList: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      newsletterSubscriber: { createMany: jest.fn() },
    };
    eligibility = createMock(NewsletterEligibilityService);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsletterListService,
        { provide: PrismaClient, useValue: prismaMock },
        { provide: NewsletterEligibilityService, useValue: eligibility },
      ],
    }).compile();

    service = module.get(NewsletterListService);
  });

  describe('list', () => {
    it('returns all lists ordered by name', async () => {
      prismaMock.newsletterList.findMany.mockResolvedValue([mockList()]);

      await expect(service.list()).resolves.toEqual([mockList()]);
      expect(prismaMock.newsletterList.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('get', () => {
    it('throws when the list does not exist', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(null);

      await expect(service.get('missing')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('creates the list together with its member plans', async () => {
      prismaMock.newsletterList.create.mockResolvedValue(mockList());

      await service.create({
        name: 'Members',
        slug: 'members',
        requiresSubscription: true,
        memberPlanIds: ['plan-a', 'plan-b'],
      });

      expect(prismaMock.newsletterList.create).toHaveBeenCalledWith({
        data: {
          name: 'Members',
          slug: 'members',
          requiresSubscription: true,
          memberPlans: {
            createMany: {
              data: [{ memberPlanId: 'plan-a' }, { memberPlanId: 'plan-b' }],
            },
          },
        },
      });
    });

    it('rejects a subscriber-only list without member plans', async () => {
      await expect(
        service.create({
          name: 'Members',
          slug: 'members',
          requiresSubscription: true,
          memberPlanIds: [],
        })
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.newsletterList.create).not.toHaveBeenCalled();
    });

    it('accepts a subscriber-only list for any member plan', async () => {
      prismaMock.newsletterList.create.mockResolvedValue(mockList());

      await service.create({
        name: 'Members',
        slug: 'members',
        requiresSubscription: true,
        anyMemberPlan: true,
      });

      expect(prismaMock.newsletterList.create).toHaveBeenCalled();
    });

    it('turns a duplicate slug into a readable error', async () => {
      prismaMock.newsletterList.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: 'test',
        })
      );

      await expect(
        service.create({ name: 'Members', slug: 'members' })
      ).rejects.toThrow(
        'A newsletter list with the slug "members" already exists.'
      );
    });
  });

  describe('update', () => {
    it('replaces the member plans', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(
        mockList({
          requiresSubscription: true,
          memberPlans: [{ memberPlanId: 'plan-a' }],
        })
      );
      prismaMock.newsletterList.update.mockResolvedValue(mockList());

      await service.update({ id: 'list-1', memberPlanIds: ['plan-b'] });

      expect(prismaMock.newsletterList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: {
          memberPlans: {
            deleteMany: { memberPlanId: { notIn: ['plan-b'] } },
            createMany: {
              skipDuplicates: true,
              data: [{ memberPlanId: 'plan-b' }],
            },
          },
        },
      });
    });

    it('keeps the member plans when none are given', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(mockList());
      prismaMock.newsletterList.update.mockResolvedValue(mockList());

      await service.update({ id: 'list-1', name: 'Renamed' });

      expect(prismaMock.newsletterList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { name: 'Renamed', memberPlans: undefined },
      });
    });

    it('rejects removing the last plan of a subscriber-only list', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(
        mockList({
          requiresSubscription: true,
          memberPlans: [{ memberPlanId: 'plan-a' }],
        })
      );

      await expect(
        service.update({ id: 'list-1', memberPlanIds: [] })
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.newsletterList.update).not.toHaveBeenCalled();
    });

    it('rejects making a list without plans subscriber-only', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(mockList());

      await expect(
        service.update({ id: 'list-1', requiresSubscription: true })
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws when the list does not exist', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(null);

      await expect(
        service.update({ id: 'missing', name: 'x' })
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes the list', async () => {
      prismaMock.newsletterList.delete.mockResolvedValue(mockList());

      await expect(service.delete('list-1')).resolves.toEqual(mockList());
      expect(prismaMock.newsletterList.delete).toHaveBeenCalledWith({
        where: { id: 'list-1' },
      });
    });
  });

  describe('backfill', () => {
    it('rejects lists that do not require a subscription', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(mockList());

      await expect(service.backfill('list-1')).rejects.toBeInstanceOf(
        BadRequestException
      );
    });

    it('adds every eligible user without overriding existing entries', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(
        mockList({
          requiresSubscription: true,
          memberPlans: [{ memberPlanId: 'plan-a' }],
        })
      );
      eligibility.eligibleUserIds?.mockResolvedValue(['user-1', 'user-2']);
      prismaMock.newsletterSubscriber.createMany.mockResolvedValue({
        count: 1,
      });

      await expect(service.backfill('list-1')).resolves.toBe(1);

      expect(eligibility.eligibleUserIds).toHaveBeenCalledWith({
        requiresSubscription: true,
        anyMemberPlan: false,
        memberPlanIds: ['plan-a'],
      });

      const now = new Date('2026-06-15T12:00:00.000Z');
      expect(prismaMock.newsletterSubscriber.createMany).toHaveBeenCalledWith({
        skipDuplicates: true,
        data: ['user-1', 'user-2'].map(userId => ({
          userId,
          listId: 'list-1',
          source: NewsletterSubscriberSource.auto,
          subscribedAt: now,
          confirmedAt: now,
        })),
      });
    });

    it('inserts in chunks for large audiences', async () => {
      prismaMock.newsletterList.findUnique.mockResolvedValue(
        mockList({ requiresSubscription: true, anyMemberPlan: true })
      );
      eligibility.eligibleUserIds?.mockResolvedValue(
        Array.from({ length: 2500 }, (_, index) => `user-${index}`)
      );
      prismaMock.newsletterSubscriber.createMany.mockResolvedValue({
        count: 1000,
      });

      await expect(service.backfill('list-1')).resolves.toBe(3000);
      expect(prismaMock.newsletterSubscriber.createMany).toHaveBeenCalledTimes(
        3
      );
    });
  });
});
