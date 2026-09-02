import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { NotificationConfirmationService } from './notification-confirmation.service';
import { NotificationSource } from './notification-read.model';

describe('NotificationConfirmationService', () => {
  let service: NotificationConfirmationService;

  const mockPrisma = {
    notificationConfirmation: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationConfirmationService,
        {
          provide: PrismaClient,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<NotificationConfirmationService>(
      NotificationConfirmationService
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists all confirmations of the instance', async () => {
    mockPrisma.notificationConfirmation.findMany.mockResolvedValue([]);

    await service.getNotificationConfirmations();

    expect(mockPrisma.notificationConfirmation.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('confirms a notification once for the whole instance, keeping the first confirmation', async () => {
    mockPrisma.notificationConfirmation.upsert.mockResolvedValue({});

    await service.confirmNotification(
      'user-1',
      NotificationSource.PERIODIC_JOB,
      ' job-1 '
    );

    expect(mockPrisma.notificationConfirmation.upsert).toHaveBeenCalledWith({
      where: {
        source_itemId: {
          source: 'PERIODIC_JOB',
          itemId: 'job-1',
        },
      },
      update: {},
      create: {
        source: 'PERIODIC_JOB',
        itemId: 'job-1',
        confirmedByUserId: 'user-1',
      },
    });
  });

  it('rejects empty and overlong item ids', async () => {
    await expect(
      service.confirmNotification(
        'user-1',
        NotificationSource.PERIODIC_JOB,
        '  '
      )
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.confirmNotification(
        'user-1',
        NotificationSource.PERIODIC_JOB,
        'x'.repeat(201)
      )
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.notificationConfirmation.upsert).not.toHaveBeenCalled();
  });
});
