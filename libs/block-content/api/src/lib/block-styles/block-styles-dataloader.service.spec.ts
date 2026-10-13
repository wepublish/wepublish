import { Test, TestingModule } from '@nestjs/testing';
import { BlockStylesDataloaderService } from './block-styles-dataloader.service';
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

describe('BlockStylesDataloaderService', () => {
  let service: BlockStylesDataloaderService;
  let prismaMock: {
    blockStyle: {
      findMany: Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      blockStyle: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockStylesDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<BlockStylesDataloaderService>(
      BlockStylesDataloaderService
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
          BlockStylesDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<BlockStylesDataloaderService>(
        BlockStylesDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.blockStyle.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.blockStyle.findMany).toHaveBeenCalled();
      expect(prismaMock.blockStyle.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.blockStyle.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.blockStyle.findMany).toHaveBeenCalled();
      expect(prismaMock.blockStyle.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
