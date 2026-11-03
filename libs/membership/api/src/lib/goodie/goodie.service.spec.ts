import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { Mock } from 'vitest';
import { GoodieDataloader } from './goodie.dataloader';
import { GoodieService } from './goodie.service';

const goodie = {
  id: 'goodie-1',
  name: 'Booklet',
  active: true,
  stock: null,
  paymentPeriodicities: [] as PaymentPeriodicity[],
};

describe('GoodieService', () => {
  let service: GoodieService;
  let prismaMock: {
    goodie: { findFirst: Mock; findMany: Mock };
    invoiceItem: { groupBy: Mock };
  };

  beforeEach(async () => {
    prismaMock = {
      goodie: { findFirst: vi.fn(), findMany: vi.fn() },
      invoiceItem: { groupBy: vi.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodieService,
        { provide: GoodieDataloader, useValue: { prime: vi.fn() } },
        { provide: PrismaClient, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(GoodieService);
  });

  describe('getValidGoodie', () => {
    it('accepts a goodie without periodicity restriction for any periodicity', async () => {
      prismaMock.goodie.findFirst.mockResolvedValue(goodie);

      await expect(
        service.getValidGoodie('goodie-1', 'plan-1', PaymentPeriodicity.yearly)
      ).resolves.toEqual(goodie);

      expect(prismaMock.goodie.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'goodie-1',
          active: true,
          memberPlans: { some: { id: 'plan-1' } },
        },
      });
    });

    it('accepts a goodie restricted to the chosen periodicity', async () => {
      prismaMock.goodie.findFirst.mockResolvedValue({
        ...goodie,
        paymentPeriodicities: [PaymentPeriodicity.biennial],
      });

      await expect(
        service.getValidGoodie(
          'goodie-1',
          'plan-1',
          PaymentPeriodicity.biennial
        )
      ).resolves.toMatchObject({ id: 'goodie-1' });
    });

    it('rejects a goodie restricted to another periodicity', async () => {
      prismaMock.goodie.findFirst.mockResolvedValue({
        ...goodie,
        paymentPeriodicities: [PaymentPeriodicity.biennial],
      });

      await expect(
        service.getValidGoodie('goodie-1', 'plan-1', PaymentPeriodicity.yearly)
      ).rejects.toThrow(
        new BadRequestException(
          'Goodie is not available for this payment periodicity.'
        )
      );
    });

    it('rejects a goodie that is not offered with the member plan', async () => {
      prismaMock.goodie.findFirst.mockResolvedValue(null);

      await expect(
        service.getValidGoodie('goodie-1', 'plan-1', PaymentPeriodicity.yearly)
      ).rejects.toThrow(
        new BadRequestException('Goodie is not available for this member plan.')
      );
    });

    it('rejects a sold-out goodie', async () => {
      prismaMock.goodie.findFirst.mockResolvedValue({ ...goodie, stock: 2 });
      prismaMock.invoiceItem.groupBy.mockResolvedValue([
        { goodieId: 'goodie-1', _count: { _all: 2 } },
      ]);

      await expect(
        service.getValidGoodie('goodie-1', 'plan-1', PaymentPeriodicity.yearly)
      ).rejects.toThrow(new BadRequestException('Goodie is sold out.'));
    });
  });
});
