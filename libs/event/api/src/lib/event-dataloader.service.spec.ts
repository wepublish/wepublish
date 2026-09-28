import { Test, TestingModule } from '@nestjs/testing';
import { EventDataloaderService } from './event-dataloader.service';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import type { Mock } from 'vitest';

vi.mock('dataloader', () => ({
  default: vi.fn(function (this: any) {
    this.prime = vi.fn();
    this.load = vi.fn();
    this.loadMany = vi.fn();
    this.clear = vi.fn();
    this.clearAll = vi.fn();
  }),
}));

describe('EventDataloaderService', () => {
  let service: EventDataloaderService;
  let prismaMock: {
    event: {
      findMany: Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      event: {
        findMany: vi.fn(),
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
    const dataloaderMock = DataLoader.mock.instances[0] as any;
    service.prime('123', {} as any);
    expect(dataloaderMock.prime.mock.calls[0]).toMatchSnapshot();
  });

  describe('load', () => {
    beforeEach(async () => {
      // @ts-expect-error mocked so typing doesn't work
      DataLoader.mockImplementation(function (impl: any, opt: any) {
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
