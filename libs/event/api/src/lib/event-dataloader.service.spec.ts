import { Test, TestingModule } from '@nestjs/testing';
import { EventDataloaderService } from './event-dataloader.service';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

jest.mock('dataloader');

describe('EventDataloaderService', () => {
  let service: EventDataloaderService;
  let prismaMock: {
    event: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      event: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<EventDataloaderService>(
      EventDataloaderService
    );
  });

  it('should prime', () => {
    // @ts-expect-error Mock so typings incorrectly
    const dataloaderMock = DataLoader.mock.instances[0] as jest.fn;
    service.prime('123', {} as any);
    expect(dataloaderMock.prime.mock.calls[0]).toMatchSnapshot();
  });

  describe('load', () => {
    beforeEach(async () => {
      // @ts-expect-error mocked so typing doesn't work
      DataLoader.mockImplementation((impl, opt) => {
        return {
          load: (id: string) => impl([id]),
          loadMany: (ids: readonly string[]) => impl(ids),
        };
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EventDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<EventDataloaderService>(
        EventDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.event.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.event.findMany).toHaveBeenCalled();
      expect(prismaMock.event.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.event.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.event.findMany).toHaveBeenCalled();
      expect(prismaMock.event.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
