import { Test, TestingModule } from '@nestjs/testing';
import { ImageDataloaderService } from './image-dataloader.service';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

jest.mock('dataloader');

describe('ImageDataloaderService', () => {
  let service: ImageDataloaderService;
  let prismaMock: {
    image: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      image: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<ImageDataloaderService>(
      ImageDataloaderService
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
          ImageDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<ImageDataloaderService>(
        ImageDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.image.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.image.findMany).toHaveBeenCalled();
      expect(prismaMock.image.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.image.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.image.findMany).toHaveBeenCalled();
      expect(prismaMock.image.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
