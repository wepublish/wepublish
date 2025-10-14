import { Test, TestingModule } from '@nestjs/testing';
import { CommentDataloaderService } from './comment-dataloader.service';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

jest.mock('dataloader');

describe('CommentDataloaderService', () => {
  let service: CommentDataloaderService;
  let prismaMock: {
    comment: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      comment: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<CommentDataloaderService>(
      CommentDataloaderService
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
          CommentDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<CommentDataloaderService>(
        CommentDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.comment.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.comment.findMany).toHaveBeenCalled();
      expect(prismaMock.comment.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.comment.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.comment.findMany).toHaveBeenCalled();
      expect(prismaMock.comment.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
