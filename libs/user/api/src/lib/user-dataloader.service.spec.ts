import { Test, TestingModule } from '@nestjs/testing';
import { UserDataloaderService } from './user-dataloader.service';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import type { Mock, MockedClass } from 'vitest';

vi.mock('dataloader', () => ({
  default: vi.fn(function (this: any) {
    this.prime = vi.fn();
    this.load = vi.fn();
    this.loadMany = vi.fn();
    this.clear = vi.fn();
    this.clearAll = vi.fn();
  }),
}));

describe('UserDataloaderService', () => {
  let service: UserDataloaderService;
  let prismaMock: {
    user: {
      findMany: Mock;
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    prismaMock = {
      user: {
        findMany: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<UserDataloaderService>(
      UserDataloaderService
    );
  });

  it('should prime', () => {
    const dataloaderMock = (DataLoader as MockedClass<typeof DataLoader>).mock
      .instances[0];
    service.prime('123', {} as any);
    // @ts-expect-error mock
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
          UserDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<UserDataloaderService>(
        UserDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(prismaMock.user.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.user.findMany).toHaveBeenCalled();
      expect(prismaMock.user.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
