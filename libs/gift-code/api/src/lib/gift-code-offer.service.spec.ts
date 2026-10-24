import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Currency, PaymentPeriodicity, PrismaClient } from '@prisma/client';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { PaymentsService } from '@wepublish/payment/api';
import { GiftCodeOfferService } from './gift-code-offer.service';

const yearlyPrice = (
  amountMin: number | null,
  amountTarget: number | null = null
) => ({
  periodicity: PaymentPeriodicity.yearly,
  amountMin,
  amountTarget,
  amountMax: null,
});

const plan = (overrides: Record<string, unknown> = {}) => ({
  id: 'plan-1',
  active: true,
  currency: Currency.CHF,
  periodicityPricing: [yearlyPrice(10000, 12000)],
  ...overrides,
});

const offer = (overrides: Record<string, unknown> = {}) => ({
  id: 'offer-1',
  name: 'Gift',
  active: true,
  memberPlanId: 'plan-1',
  periodicity: PaymentPeriodicity.yearly,
  redemptionWindowMonths: 12,
  issueBeforePayment: false,
  ...overrides,
});

const createInput = (overrides: Record<string, unknown> = {}) => ({
  name: 'Gift',
  active: true,
  memberPlanId: 'plan-1',
  periodicity: PaymentPeriodicity.yearly,
  redemptionWindowMonths: 12,
  issueBeforePayment: false,
  paymentMethodIds: ['pm-1', 'pm-2'],
  ...overrides,
});

const setup = () => {
  const prisma = {
    giftCodeOffer: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      findUnique: vi.fn().mockResolvedValue(offer()),
      create: vi.fn().mockImplementation(({ data }) => ({
        id: 'offer-1',
        ...data,
      })),
      update: vi.fn().mockImplementation(({ data }) => ({
        ...offer(),
        ...data,
      })),
      delete: vi.fn().mockResolvedValue(offer()),
    },
    memberPlan: {
      findUnique: vi.fn().mockResolvedValue(plan()),
    },
    giftCode: {
      count: vi.fn().mockResolvedValue(0),
    },
    paymentMethod: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };
  const payments = {
    assertStandalonePaymentMethod: vi.fn().mockResolvedValue({}),
    getStandalonePaymentMethods: vi.fn().mockResolvedValue([]),
  };
  const publicContentCache = {
    invalidate: vi.fn().mockResolvedValue(undefined),
  };

  const service = new GiftCodeOfferService(
    prisma as unknown as PrismaClient,
    payments as unknown as PaymentsService,
    publicContentCache as unknown as PublicContentCacheInvalidator
  );

  return { service, prisma, payments, publicContentCache };
};

describe('GiftCodeOfferService', () => {
  describe('getPrice', () => {
    it('uses the target amount of the periodicity', () => {
      const { service } = setup();

      expect(
        service.getPrice({
          periodicity: PaymentPeriodicity.yearly,
          memberPlan: plan(),
        })
      ).toEqual({ amount: 12000, currency: Currency.CHF });
    });

    it('falls back to the minimum amount', () => {
      const { service } = setup();

      expect(
        service.getPrice({
          periodicity: PaymentPeriodicity.yearly,
          memberPlan: plan({ periodicityPricing: [yearlyPrice(10000)] }),
        })
      ).toEqual({ amount: 10000, currency: Currency.CHF });
    });

    it('derives the price of a periodicity without its own row', () => {
      const { service } = setup();

      expect(
        service.getPrice({
          periodicity: PaymentPeriodicity.yearly,
          memberPlan: plan({
            periodicityPricing: [
              {
                periodicity: PaymentPeriodicity.monthly,
                amountMin: 1000,
                amountTarget: null,
                amountMax: null,
              },
            ],
          }),
        })
      ).toEqual({ amount: 12000, currency: Currency.CHF });
    });
  });

  describe('createOffer', () => {
    it('creates the offer with its payment methods', async () => {
      const { service, prisma, payments } = setup();

      await service.createOffer(createInput());

      expect(payments.assertStandalonePaymentMethod).toHaveBeenCalledWith(
        'pm-1'
      );
      expect(payments.assertStandalonePaymentMethod).toHaveBeenCalledWith(
        'pm-2'
      );
      expect(prisma.giftCodeOffer.create).toHaveBeenCalledWith({
        data: {
          name: 'Gift',
          active: true,
          memberPlanId: 'plan-1',
          periodicity: PaymentPeriodicity.yearly,
          redemptionWindowMonths: 12,
          issueBeforePayment: false,
          paymentMethods: { connect: [{ id: 'pm-1' }, { id: 'pm-2' }] },
        },
      });
    });

    it('invalidates pages and articles', async () => {
      const { service, publicContentCache } = setup();

      await service.createOffer(createInput());

      expect(publicContentCache.invalidate).toHaveBeenCalledWith(
        'pages',
        'articles'
      );
    });

    it('rejects an unknown member plan', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(null);

      await expect(service.createOffer(createInput())).rejects.toThrow(
        BadRequestException
      );
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('rejects a periodicity without a price', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({ periodicityPricing: [] })
      );

      await expect(service.createOffer(createInput())).rejects.toThrow(
        'The member plan has no price for this periodicity'
      );
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('rejects a zero price', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({ periodicityPricing: [yearlyPrice(0)] })
      );

      await expect(service.createOffer(createInput())).rejects.toThrow(
        'The member plan has no price for this periodicity'
      );
    });

    it.each([0, -1])('rejects a redemption window of %d', async window => {
      const { service, prisma } = setup();

      await expect(
        service.createOffer(createInput({ redemptionWindowMonths: window }))
      ).rejects.toThrow('The redemption window must be at least one month');
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('accepts an unlimited redemption window', async () => {
      const { service, prisma } = setup();

      await service.createOffer(createInput({ redemptionWindowMonths: null }));

      expect(prisma.giftCodeOffer.create).toHaveBeenCalled();
    });

    it('rejects an empty payment method list', async () => {
      const { service, prisma } = setup();

      await expect(
        service.createOffer(createInput({ paymentMethodIds: [] }))
      ).rejects.toThrow('Gift code offers need at least one payment method');
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it.each(['inactive', 'retired', 'incapable'])(
      'rejects an %s payment method and names it',
      async () => {
        const { service, prisma, payments } = setup();
        payments.assertStandalonePaymentMethod.mockImplementation(
          async (id: string) => {
            if (id === 'pm-2') {
              throw new BadRequestException(
                'Payment method cannot be used for this purchase'
              );
            }

            return {};
          }
        );
        prisma.paymentMethod.findUnique.mockResolvedValue({
          id: 'pm-2',
          name: 'Bexio',
        });

        await expect(service.createOffer(createInput())).rejects.toThrow(
          'Payment method Bexio cannot be used for gift codes'
        );
        expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
      }
    );

    it('names an unknown payment method by its id', async () => {
      const { service, payments } = setup();
      payments.assertStandalonePaymentMethod.mockRejectedValue(
        new BadRequestException(
          'Payment method cannot be used for this purchase'
        )
      );

      await expect(service.createOffer(createInput())).rejects.toThrow(
        'Payment method pm-1 cannot be used for gift codes'
      );
    });

    it('passes unexpected payment method errors through', async () => {
      const { service, payments } = setup();
      const failure = new Error('db down');
      payments.assertStandalonePaymentMethod.mockRejectedValue(failure);

      await expect(service.createOffer(createInput())).rejects.toBe(failure);
    });
  });

  describe('updateOffer', () => {
    it('replaces the payment methods', async () => {
      const { service, prisma } = setup();

      await service.updateOffer({ id: 'offer-1', paymentMethodIds: ['pm-3'] });

      expect(prisma.giftCodeOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: { paymentMethods: { set: [{ id: 'pm-3' }] } },
      });
    });

    it('keeps the payment methods when none are sent', async () => {
      const { service, prisma, payments } = setup();

      await service.updateOffer({ id: 'offer-1', name: 'Renamed' });

      expect(payments.assertStandalonePaymentMethod).not.toHaveBeenCalled();
      expect(prisma.giftCodeOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: { name: 'Renamed', paymentMethods: undefined },
      });
    });

    it('validates the merged offer', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({ periodicityPricing: [yearlyPrice(0)] })
      );

      await expect(
        service.updateOffer({ id: 'offer-1', memberPlanId: 'plan-2' })
      ).rejects.toThrow('The member plan has no price for this periodicity');
      expect(prisma.memberPlan.findUnique).toHaveBeenCalledWith({
        where: { id: 'plan-2' },
        include: { periodicityPricing: true },
      });
      expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
    });

    it('rejects a window of 0 on update', async () => {
      const { service, prisma } = setup();

      await expect(
        service.updateOffer({ id: 'offer-1', redemptionWindowMonths: 0 })
      ).rejects.toThrow('The redemption window must be at least one month');
      expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
    });

    it('rejects an empty payment method list on update', async () => {
      const { service } = setup();

      await expect(
        service.updateOffer({ id: 'offer-1', paymentMethodIds: [] })
      ).rejects.toThrow('Gift code offers need at least one payment method');
    });

    it('rejects an incapable payment method on update', async () => {
      const { service, prisma, payments } = setup();
      payments.assertStandalonePaymentMethod.mockRejectedValue(
        new BadRequestException(
          'Payment method cannot be used for this purchase'
        )
      );
      prisma.paymentMethod.findUnique.mockResolvedValue({
        id: 'pm-3',
        name: 'Rechnung',
      });

      await expect(
        service.updateOffer({ id: 'offer-1', paymentMethodIds: ['pm-3'] })
      ).rejects.toThrow(
        'Payment method Rechnung cannot be used for gift codes'
      );
      expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
    });

    it('rejects an unknown offer', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOffer({ id: 'missing', name: 'x' })
      ).rejects.toThrow(NotFoundException);
    });

    it('invalidates pages and articles', async () => {
      const { service, publicContentCache } = setup();

      await service.updateOffer({ id: 'offer-1', name: 'Renamed' });

      expect(publicContentCache.invalidate).toHaveBeenCalledWith(
        'pages',
        'articles'
      );
    });
  });

  describe('deleteOffer', () => {
    it('is blocked when codes were sold', async () => {
      const { service, prisma, publicContentCache } = setup();
      prisma.giftCode.count.mockResolvedValue(2);

      await expect(service.deleteOffer('offer-1')).rejects.toThrow(
        'This offer has sold gift codes. Deactivate it instead.'
      );
      expect(prisma.giftCode.count).toHaveBeenCalledWith({
        where: { offerId: 'offer-1' },
      });
      expect(prisma.giftCodeOffer.delete).not.toHaveBeenCalled();
      expect(publicContentCache.invalidate).not.toHaveBeenCalled();
    });

    it('deletes an offer without codes and invalidates', async () => {
      const { service, prisma, publicContentCache } = setup();

      await expect(service.deleteOffer('offer-1')).resolves.toEqual(offer());

      expect(prisma.giftCodeOffer.delete).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
      });
      expect(publicContentCache.invalidate).toHaveBeenCalledWith(
        'pages',
        'articles'
      );
    });
  });

  describe('getActiveOffersByIds', () => {
    it('returns nothing without a query for no ids', async () => {
      const { service, prisma } = setup();

      await expect(service.getActiveOffersByIds([])).resolves.toEqual([]);
      expect(prisma.giftCodeOffer.findMany).not.toHaveBeenCalled();
    });

    it('loads only active offers of active plans in the order of the ids', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findMany.mockResolvedValue([
        offer({ id: 'a' }),
        offer({ id: 'c' }),
      ]);

      const result = await service.getActiveOffersByIds(['c', 'b', 'a']);

      expect(prisma.giftCodeOffer.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['c', 'b', 'a'] },
          active: true,
          memberPlan: { active: true },
        },
      });
      expect(result.map(({ id }) => id)).toEqual(['c', 'a']);
    });
  });

  describe('getPaymentMethods', () => {
    it('passes the offer methods through the standalone filter', async () => {
      const { service, prisma, payments } = setup();
      const methods = [{ id: 'pm-2' }];
      prisma.paymentMethod.findMany.mockResolvedValue([
        { id: 'pm-1' },
        { id: 'pm-2' },
      ]);
      payments.getStandalonePaymentMethods.mockResolvedValue(methods);

      await expect(service.getPaymentMethods('offer-1')).resolves.toBe(methods);

      expect(prisma.paymentMethod.findMany).toHaveBeenCalledWith({
        where: { giftCodeOffers: { some: { id: 'offer-1' } } },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(payments.getStandalonePaymentMethods).toHaveBeenCalledWith([
        'pm-1',
        'pm-2',
      ]);
    });
  });

  describe('getOffers', () => {
    it('filters and paginates', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findMany.mockResolvedValue([
        offer({ id: 'a' }),
        offer({ id: 'b' }),
      ]);
      prisma.giftCodeOffer.count.mockResolvedValue(5);

      const result = await service.getOffers({
        take: 1,
        skip: 0,
        filter: { memberPlanId: 'plan-1', active: true, name: 'gi' },
      });

      expect(prisma.giftCodeOffer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { memberPlanId: 'plan-1' },
              { active: true },
              { name: { contains: 'gi', mode: 'insensitive' } },
            ],
          },
          take: 2,
          skip: 0,
          orderBy: { modifiedAt: 'desc' },
        })
      );
      expect(result.nodes.map(({ id }) => id)).toEqual(['a']);
      expect(result.totalCount).toBe(5);
      expect(result.pageInfo.hasNextPage).toBe(true);
    });
  });
});
