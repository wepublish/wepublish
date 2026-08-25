import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { ChangelogService } from './changelog.service';

const mockEntry = {
  id: 'entry-1',
  createdAt: new Date('2026-08-25T12:00:00Z'),
  modifiedAt: new Date('2026-08-25T12:00:00Z'),
  name: '20260825120000_user_changelog',
  releasedAt: new Date('2026-08-25T12:00:00Z'),
  title: 'A title',
  lead: 'A lead',
  description: 'A description',
  actionRequired: true,
  confirmedAt: null,
  confirmedByUserId: null,
};

describe('ChangelogService', () => {
  let service: ChangelogService;

  const mockPrisma = {
    changelogEntry: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    changelogEntryTranslation: {
      findUnique: jest.fn(),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangelogService,
        {
          provide: PrismaClient,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ChangelogService>(ChangelogService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getChangelogEntries', () => {
    it('returns entries newest first with pagination info', async () => {
      mockPrisma.changelogEntry.count.mockResolvedValue(1);
      mockPrisma.changelogEntry.findMany.mockResolvedValue([
        { ...mockEntry, translations: [] },
      ]);

      const result = await service.getChangelogEntries({});

      expect(mockPrisma.changelogEntry.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 11,
        orderBy: {
          releasedAt: 'desc',
        },
        include: {
          translations: {
            where: { locale: '' },
          },
        },
      });
      expect(result).toEqual({
        nodes: [mockEntry],
        totalCount: 1,
        pageInfo: {
          hasPreviousPage: false,
          hasNextPage: false,
          startCursor: 'entry-1',
          endCursor: 'entry-1',
        },
      });
    });

    it('slices the extra row used to detect a next page', async () => {
      const entries = Array.from({ length: 3 }, (_, index) => ({
        ...mockEntry,
        id: `entry-${index + 1}`,
        translations: [],
      }));
      mockPrisma.changelogEntry.count.mockResolvedValue(10);
      mockPrisma.changelogEntry.findMany.mockResolvedValue(entries);

      const result = await service.getChangelogEntries({ take: 2, skip: 2 });

      expect(result.nodes).toHaveLength(2);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });

    it('maps the filter to a prisma where clause', async () => {
      mockPrisma.changelogEntry.count.mockResolvedValue(0);
      mockPrisma.changelogEntry.findMany.mockResolvedValue([]);

      await service.getChangelogEntries({
        filter: { actionRequired: true, confirmed: false },
      });

      expect(mockPrisma.changelogEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            actionRequired: true,
            confirmedAt: null,
          },
        })
      );

      await service.getChangelogEntries({
        filter: { confirmed: true },
      });

      expect(mockPrisma.changelogEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            confirmedAt: { not: null },
          },
        })
      );
    });

    it('returns localized content for the requested locale', async () => {
      mockPrisma.changelogEntry.count.mockResolvedValue(2);
      mockPrisma.changelogEntry.findMany.mockResolvedValue([
        {
          ...mockEntry,
          translations: [
            {
              locale: 'de',
              title: 'Ein Titel',
              lead: 'Ein Lead',
              description: 'Eine Beschreibung',
            },
          ],
        },
        { ...mockEntry, id: 'entry-2', translations: [] },
      ]);

      const result = await service.getChangelogEntries({ locale: 'de' });

      expect(mockPrisma.changelogEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            translations: {
              where: { locale: 'de' },
            },
          },
        })
      );
      expect(result.nodes[0]).toMatchObject({
        title: 'Ein Titel',
        lead: 'Ein Lead',
        description: 'Eine Beschreibung',
      });
      expect(result.nodes[1]).toMatchObject({
        title: 'A title',
        lead: 'A lead',
      });
    });

    it('caps the take at the maximum page size', async () => {
      mockPrisma.changelogEntry.count.mockResolvedValue(0);
      mockPrisma.changelogEntry.findMany.mockResolvedValue([]);

      await service.getChangelogEntries({ take: 100_000 });

      expect(mockPrisma.changelogEntry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 101 })
      );
    });
  });

  describe('confirmChangelogEntry', () => {
    it('confirms an unconfirmed action-required entry', async () => {
      mockPrisma.changelogEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.changelogEntry.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...mockEntry, ...data })
      );

      const result = await service.confirmChangelogEntry('entry-1', 'user-1');

      expect(mockPrisma.changelogEntry.update).toHaveBeenCalledWith({
        where: { id: 'entry-1' },
        data: {
          confirmedAt: expect.any(Date),
          confirmedByUserId: 'user-1',
        },
      });
      expect(result.confirmedByUserId).toBe('user-1');
    });

    it('throws when the entry does not exist', async () => {
      mockPrisma.changelogEntry.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmChangelogEntry('missing', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when the entry does not require an action', async () => {
      mockPrisma.changelogEntry.findUnique.mockResolvedValue({
        ...mockEntry,
        actionRequired: false,
      });

      await expect(
        service.confirmChangelogEntry('entry-1', 'user-1')
      ).rejects.toThrow(BadRequestException);
    });

    it('returns localized content when confirming with a locale', async () => {
      mockPrisma.changelogEntry.findUnique.mockResolvedValue(mockEntry);
      mockPrisma.changelogEntry.update.mockImplementation(({ data }) =>
        Promise.resolve({ ...mockEntry, ...data })
      );
      mockPrisma.changelogEntryTranslation.findUnique.mockResolvedValue({
        locale: 'fr',
        title: 'Un titre',
        lead: 'Un lead',
        description: null,
      });

      const result = await service.confirmChangelogEntry(
        'entry-1',
        'user-1',
        'fr'
      );

      expect(
        mockPrisma.changelogEntryTranslation.findUnique
      ).toHaveBeenCalledWith({
        where: {
          entryId_locale: {
            entryId: 'entry-1',
            locale: 'fr',
          },
        },
      });
      expect(result.title).toBe('Un titre');
      expect(result.confirmedByUserId).toBe('user-1');
    });

    it('keeps the first confirmation when confirming twice', async () => {
      const confirmed = {
        ...mockEntry,
        confirmedAt: new Date('2026-08-20T08:00:00Z'),
        confirmedByUserId: 'user-1',
      };
      mockPrisma.changelogEntry.findUnique.mockResolvedValue(confirmed);

      const result = await service.confirmChangelogEntry('entry-1', 'user-2');

      expect(mockPrisma.changelogEntry.update).not.toHaveBeenCalled();
      expect(result).toEqual(confirmed);
    });
  });
});
