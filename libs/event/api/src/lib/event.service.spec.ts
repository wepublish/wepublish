import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { PrismaClient } from '@prisma/client';
import { EventDataloaderService } from './event-dataloader.service';
import { SortOrder } from '@wepublish/utils/api';
import { EventSort } from './event.model';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('EventService', () => {
  let service: EventService;
  let prismaMock: {
    event: { [method in keyof PrismaClient['event']]?: jest.Mock };
  };

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    prismaMock = {
      event: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: PrismaClient, useValue: prismaMock },
        {
          provide: EventDataloaderService,
          useValue: {
            prime: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should query an event by id', async () => {
    prismaMock.event.findUnique?.mockResolvedValue({});
    await service.getEventById('1234');

    expect(prismaMock.event.findUnique?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query events based on filter', async () => {
    prismaMock.event.findMany?.mockResolvedValue([]);

    await service.getEvents({
      filter: {
        from: new Date('2023-01-01'),
        to: new Date('2023-01-01'),
        upcomingOnly: true,
        location: 'location',
        name: 'name',
        tags: ['1234'],
      },
      sort: EventSort.EndsAt,
      order: SortOrder.Ascending,
      skip: 5,
      take: 5,
    });

    expect(prismaMock.event.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.event.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should query events using cursor based pagination', async () => {
    prismaMock.event.findMany?.mockResolvedValue([]);

    await service.getEvents({
      cursorId: '1234',
    });

    expect(prismaMock.event.findMany?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.event.count?.mock.calls[0]).toMatchSnapshot();
  });

  it('should return paginated events', async () => {
    prismaMock.event.findMany?.mockResolvedValue([
      { id: '123' },
      { id: '321' },
    ]);
    prismaMock.event.count?.mockResolvedValue(1000);

    const result = await service.getEvents({
      take: 1,
      skip: 5,
    });

    expect(result).toMatchSnapshot();
  });

  it('should create an event', async () => {
    await service.createEvent({
      name: 'Name',
      startsAt: new Date('2023-01-01'),
      endsAt: new Date('2023-01-01'),
      description: [],
      imageId: '123',
      location: 'Location',
      tagIds: ['123', '321'],
    });

    expect(prismaMock.event.create?.mock.calls[0]).toMatchSnapshot();
  });

  it('should update an event', async () => {
    prismaMock.event.findUnique?.mockResolvedValue({
      id: '123',
    });

    await service.updateEvent({
      id: '123',
      name: 'Name',
      startsAt: new Date('2023-01-01'),
      endsAt: new Date('2023-01-01'),
      description: [],
      imageId: '123',
      location: 'Location',
      tagIds: ['123', '321'],
    });

    expect(prismaMock.event.findUnique?.mock.calls[0]).toMatchSnapshot();
    expect(prismaMock.event.update?.mock.calls[0]).toMatchSnapshot();
  });

  it('should delete an event', async () => {
    await service.deleteEvent('1234');

    expect(prismaMock.event.delete?.mock.calls[0]).toMatchSnapshot();
  });

  it('should not allow to set the start date after the end date', async () => {
    await expect(async () => {
      await service.createEvent({
        name: 'Foo',
        startsAt: new Date('2023-01-02'),
        endsAt: new Date('2023-01-01'),
        description: [],
      });
    }).rejects.toThrow(BadRequestException);

    prismaMock.event.findUnique?.mockResolvedValue({
      id: '1234',
      startsAt: new Date('2023-01-02'),
    });

    await expect(async () => {
      await service.updateEvent({
        id: '1234',
        name: 'Foo',
        startsAt: new Date('2023-01-03'),
        endsAt: new Date('2023-01-02'),
      });
    }).rejects.toThrow(BadRequestException);

    await expect(async () => {
      await service.updateEvent({
        id: '1234',
        name: 'Foo',
        endsAt: new Date('2023-01-01'),
      });
    }).rejects.toThrow(BadRequestException);
  });

  it('should throw if event can not be found', async () => {
    await expect(async () => {
      await service.getEventById('1234');
    }).rejects.toThrow(NotFoundException);

    await expect(async () => {
      await service.updateEvent({
        id: '1234',
      });
    }).rejects.toThrow(NotFoundException);
  });
});
