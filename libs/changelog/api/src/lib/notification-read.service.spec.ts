import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { NotificationSource } from './notification-read.model';
import { NotificationReadService } from './notification-read.service';

describe('NotificationReadService', () => {
  let service: NotificationReadService;

  const mockPrisma = {
    notificationRead: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      createMany: vi.fn(),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationReadService,
        {
          provide: PrismaClient,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NotificationReadService>(NotificationReadService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists the reads of the given user only', async () => {
    mockPrisma.notificationRead.findMany.mockResolvedValue([]);

    await service.getNotificationReads('user-1');

    expect(mockPrisma.notificationRead.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('marks a notification as read via an idempotent upsert', async () => {
    mockPrisma.notificationRead.upsert.mockResolvedValue({});

    await service.markNotificationRead(
      'user-1',
      NotificationSource.CHANGELOG,
      ' entry-1 '
    );

    expect(mockPrisma.notificationRead.upsert).toHaveBeenCalledWith({
      where: {
        userId_source_itemId: {
          userId: 'user-1',
          source: 'CHANGELOG',
          itemId: 'entry-1',
        },
      },
      update: {},
      create: {
        userId: 'user-1',
        source: 'CHANGELOG',
        itemId: 'entry-1',
      },
    });
  });

  it('rejects empty and overlong item ids', async () => {
    await expect(
      service.markNotificationRead('user-1', NotificationSource.CHANGELOG, '  ')
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.markNotificationRead(
        'user-1',
        NotificationSource.ONE_MESSAGE,
        'x'.repeat(201)
      )
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.notificationRead.upsert).not.toHaveBeenCalled();
  });

  describe('markNotificationsRead', () => {
    it('marks several items read at once, skipping ones already read', async () => {
      mockPrisma.notificationRead.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.notificationRead.findMany.mockResolvedValue([]);

      await service.markNotificationsRead(
        'user-1',
        NotificationSource.CHANGELOG,
        [' entry-1 ', 'entry-2', 'entry-1']
      );

      expect(mockPrisma.notificationRead.createMany).toHaveBeenCalledWith({
        data: [
          { userId: 'user-1', source: 'CHANGELOG', itemId: 'entry-1' },
          { userId: 'user-1', source: 'CHANGELOG', itemId: 'entry-2' },
        ],
        skipDuplicates: true,
      });
      expect(mockPrisma.notificationRead.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          source: 'CHANGELOG',
          itemId: { in: ['entry-1', 'entry-2'] },
        },
      });
    });

    it('does nothing for an empty list', async () => {
      expect(
        await service.markNotificationsRead(
          'user-1',
          NotificationSource.CHANGELOG,
          []
        )
      ).toEqual([]);
      expect(mockPrisma.notificationRead.createMany).not.toHaveBeenCalled();
    });

    it('rejects invalid ids and more than 100 at once', async () => {
      await expect(
        service.markNotificationsRead('user-1', NotificationSource.CHANGELOG, [
          'ok',
          ' ',
        ])
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.markNotificationsRead(
          'user-1',
          NotificationSource.CHANGELOG,
          Array.from({ length: 101 }, (_, index) => `entry-${index}`)
        )
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.notificationRead.createMany).not.toHaveBeenCalled();
    });
  });
});
