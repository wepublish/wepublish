import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { SessionCacheInvalidator } from '@wepublish/authentication/api';
import { PublicContentCacheInvalidator } from '@wepublish/public-content-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { SortOrder } from '@wepublish/utils/api';
import { UserService } from './user.service';
import { HibpService } from './hibp.service';
import { UserDataloaderService } from './user-dataloader.service';
import { UserSort } from './user.model';
import { emailSegmentWhere, MailEmailSegment } from './email-segment';
import { emailQualitySlices } from './email-quality-order';

const PATTERN = '@placeholder.neuewege.ch';

describe('UserService.getUsers', () => {
  let service: UserService;
  let prisma: {
    user: { count: Mock; findMany: Mock };
    settingLetterProvider: { findMany: Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      settingLetterProvider: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ placeholderEmailContains: PATTERN }]),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaClient, useValue: prisma },
        { provide: MailContext, useValue: {} },
        { provide: HibpService, useValue: {} },
        { provide: MailchimpContactService, useValue: {} },
        { provide: UserDataloaderService, useValue: { prime: vi.fn() } },
        { provide: SessionCacheInvalidator, useValue: {} },
        { provide: PublicContentCacheInvalidator, useValue: {} },
      ],
    }).compile();

    service = module.get(UserService);
  });

  const whereOfFirstCount = () => prisma.user.count.mock.calls[0][0].where;

  it('does not read the placeholder patterns without an email filter', async () => {
    await service.getUsers({ filter: { text: 'jane' } } as any);

    expect(prisma.settingLetterProvider.findMany).not.toHaveBeenCalled();
  });

  it('filters by the picked email segments', async () => {
    await service.getUsers({
      filter: {
        emailSegments: [MailEmailSegment.dead, MailEmailSegment.unknown],
      },
    } as any);

    expect(whereOfFirstCount().AND).toContainEqual(
      emailSegmentWhere(
        [MailEmailSegment.dead, MailEmailSegment.unknown],
        [PATTERN]
      )
    );
  });

  it('pages the email status sort across the level slices', async () => {
    // 2 active, 3 unknown or never evaluated, 0 unresponsive, 1 dead
    const sizes = [2, 3, 0, 1];
    const slices = emailQualitySlices(SortOrder.Ascending);
    const indexOf = (where: any) =>
      slices.findIndex(
        ({ where: slice }) => JSON.stringify(slice) === JSON.stringify(where)
      );

    prisma.user.count.mockImplementation(
      async ({ where }: any) => sizes[indexOf(where.AND[1])]
    );
    prisma.user.findMany.mockImplementation(
      async ({ where, skip, take }: any) => {
        const index = indexOf(where.AND[1]);

        return Array.from({ length: sizes[index] }, (_, i) => ({
          id: `${index}-${i}`,
        })).slice(skip, skip + take);
      }
    );

    const result = await service.getUsers({
      sort: UserSort.EmailQuality,
      order: SortOrder.Ascending,
      skip: 1,
      take: 3,
    } as any);

    expect(result.totalCount).toBe(6);
    expect(result.nodes.map(({ id }: any) => id)).toEqual([
      '0-1',
      '1-0',
      '1-1',
    ]);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.pageInfo.hasPreviousPage).toBe(true);
  });

  it('keeps a single query for the other sorts', async () => {
    await service.getUsers({ sort: UserSort.Name, take: 10 } as any);

    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.findMany.mock.calls[0][0].orderBy).toEqual({
      name: 'desc',
    });
  });

  describe('getEmailSegments', () => {
    it('offers every segment, best to worst, placeholder last', async () => {
      expect(await service.getEmailSegments()).toEqual([
        MailEmailSegment.active,
        MailEmailSegment.unknown,
        MailEmailSegment.unresponsive,
        MailEmailSegment.dead,
        MailEmailSegment.placeholder,
      ]);
    });

    it('leaves out placeholder without a configured pattern', async () => {
      prisma.settingLetterProvider.findMany.mockResolvedValue([
        { placeholderEmailContains: null },
      ]);

      expect(await service.getEmailSegments()).not.toContain(
        MailEmailSegment.placeholder
      );
    });
  });
});
