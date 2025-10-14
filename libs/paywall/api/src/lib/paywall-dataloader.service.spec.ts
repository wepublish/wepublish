import { Test, TestingModule } from '@nestjs/testing';
import { PaywallDataloaderService } from './paywall-dataloader.service';
import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

jest.mock('dataloader');

describe('PaywallDataloaderService', () => {
  let service: PaywallDataloaderService;
  let prismaMock: {
    paywall: {
      findMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prismaMock = {
      paywall: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaywallDataloaderService,
        {
          provide: PrismaClient,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = await module.resolve<PaywallDataloaderService>(
      PaywallDataloaderService
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
          PaywallDataloaderService,
          {
            provide: PrismaClient,
            useValue: prismaMock,
          },
        ],
      }).compile();

      service = await module.resolve<PaywallDataloaderService>(
        PaywallDataloaderService
      );
    });

    it('should load one', async () => {
      prismaMock.paywall.findMany.mockResolvedValue([]);

      await service.load('123');
      expect(prismaMock.paywall.findMany).toHaveBeenCalled();
      expect(prismaMock.paywall.findMany.mock.calls[0]).toMatchSnapshot();
    });

    it('should load many', async () => {
      prismaMock.paywall.findMany.mockResolvedValue([]);

      await service.loadMany(['123', '321']);
      expect(prismaMock.paywall.findMany).toHaveBeenCalled();
      expect(prismaMock.paywall.findMany.mock.calls[0]).toMatchSnapshot();
    });
  });
});
