import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Currency, PaymentPeriodicity, PrismaClient } from '@prisma/client';
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

const monthlyPrice = (amountMin: number) => ({
  periodicity: PaymentPeriodicity.monthly,
  amountMin,
  amountTarget: null,
  amountMax: null,
});

const availableMethods = (overrides: Record<string, unknown> = {}) => ({
  paymentMethodIDs: ['pm-renew'],
  paymentPeriodicities: [PaymentPeriodicity.yearly],
  forceAutoRenewal: false,
  ...overrides,
});

const plan = (overrides: Record<string, unknown> = {}) => ({
  id: 'plan-1',
  active: true,
  extendable: true,
  currency: Currency.CHF,
  periodicityPricing: [yearlyPrice(10000, 12000)],
  availablePaymentMethods: [availableMethods()],
  ...overrides,
});

const renewalMethod = (overrides: Record<string, unknown> = {}) => ({
  id: 'pm-renew',
  name: 'Rechnung',
  active: true,
  paymentProviderID: 'invoice',
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
      findFirst: vi.fn().mockResolvedValue(null),
      findUnique: vi.fn().mockResolvedValue(offer()),
      create: vi.fn().mockImplementation(async ({ data }) => ({
        id: 'offer-1',
        ...data,
      })),
      update: vi.fn().mockImplementation(async ({ data }) => ({
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
      findUnique: vi
        .fn()
        .mockImplementation(async ({ where }) =>
          where.id === 'pm-renew' ? renewalMethod() : null
        ),
    },
    settingPaymentProvider: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  const payments = {
    assertStandalonePaymentMethod: vi.fn().mockResolvedValue({}),
    getStandalonePaymentMethods: vi.fn().mockResolvedValue([]),
  };

  const service = new GiftCodeOfferService(
    prisma as unknown as PrismaClient,
    payments as unknown as PaymentsService
  );

  return { service, prisma, payments };
};

describe('GiftCodeOfferService', () => {
  it('depends only on prisma and the payments service', () => {
    expect(
      Reflect.getMetadata('design:paramtypes', GiftCodeOfferService)
    ).toEqual([PrismaClient, PaymentsService]);
  });

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

    it('lets the offer allow discount codes', async () => {
      const { service, prisma } = setup();

      await service.createOffer({
        ...createInput(),
        allowDiscountCodes: true,
      });

      expect(prisma.giftCodeOffer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ allowDiscountCodes: true }),
      });
    });

    it('leaves discount codes to the database default when null is sent', async () => {
      const { service, prisma } = setup();

      await service.createOffer({
        ...createInput(),
        allowDiscountCodes: null as unknown as boolean,
      });

      expect(
        prisma.giftCodeOffer.create.mock.calls[0][0].data.allowDiscountCodes
      ).toBeUndefined();
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

    it('rejects a periodicity the member plan does not sell', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({
          periodicityPricing: [monthlyPrice(1000)],
          availablePaymentMethods: [
            availableMethods({
              paymentPeriodicities: [PaymentPeriodicity.yearly],
            }),
          ],
        })
      );

      await expect(
        service.createOffer(
          createInput({ periodicity: PaymentPeriodicity.monthly })
        )
      ).rejects.toThrow('The member plan is not sold with this periodicity');
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('accepts a periodicity sold by any row of the member plan', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({
          periodicityPricing: [monthlyPrice(1000)],
          availablePaymentMethods: [
            availableMethods({
              paymentPeriodicities: [PaymentPeriodicity.monthly],
            }),
            availableMethods({
              paymentPeriodicities: [PaymentPeriodicity.yearly],
            }),
          ],
        })
      );

      await service.createOffer(createInput());

      expect(prisma.giftCodeOffer.create).toHaveBeenCalled();
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

  describe('one offer per member plan', () => {
    it('rejects a second offer for the same member plan', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findFirst.mockResolvedValue(
        offer({ id: 'offer-2' })
      );

      await expect(service.createOffer(createInput())).rejects.toThrow(
        new BadRequestException('This member plan already has a gift offer.')
      );
      expect(prisma.giftCodeOffer.findFirst).toHaveBeenCalledWith({
        where: { memberPlanId: 'plan-1' },
        select: { id: true },
      });
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('lets an offer keep its own member plan on update', async () => {
      const { service, prisma } = setup();

      await service.updateOffer({ id: 'offer-1', name: 'Renamed' });

      expect(prisma.giftCodeOffer.findFirst).toHaveBeenCalledWith({
        where: { memberPlanId: 'plan-1', id: { not: 'offer-1' } },
        select: { id: true },
      });
      expect(prisma.giftCodeOffer.update).toHaveBeenCalled();
    });

    it('rejects moving an offer to a member plan that has one', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findFirst.mockResolvedValue(
        offer({ id: 'offer-2', memberPlanId: 'plan-2' })
      );

      await expect(
        service.updateOffer({ id: 'offer-1', memberPlanId: 'plan-2' })
      ).rejects.toThrow('This member plan already has a gift offer.');
      expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
    });

    it('reports a concurrent duplicate the same way', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.create.mockRejectedValue(
        Object.assign(new Error('Unique constraint failed'), {
          code: 'P2002',
        })
      );

      await expect(service.createOffer(createInput())).rejects.toThrow(
        new BadRequestException('This member plan already has a gift offer.')
      );
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

    it('switches discount codes on and off', async () => {
      const { service, prisma } = setup();

      await service.updateOffer({ id: 'offer-1', allowDiscountCodes: false });

      expect(prisma.giftCodeOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: { allowDiscountCodes: false, paymentMethods: undefined },
      });
    });

    it('keeps the discount code setting when null is sent', async () => {
      const { service, prisma } = setup();

      await service.updateOffer({
        id: 'offer-1',
        allowDiscountCodes: null as unknown as boolean,
      });

      expect(prisma.giftCodeOffer.update).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
        data: { allowDiscountCodes: undefined, paymentMethods: undefined },
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
        include: { periodicityPricing: true, availablePaymentMethods: true },
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

    it('rejects changing to a periodicity the member plan does not sell', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({ periodicityPricing: [monthlyPrice(1000)] })
      );

      await expect(
        service.updateOffer({
          id: 'offer-1',
          periodicity: PaymentPeriodicity.monthly,
        })
      ).rejects.toThrow('The member plan is not sold with this periodicity');
      expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
    });

    it('rejects moving to a member plan that does not sell the periodicity', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({
          id: 'plan-2',
          availablePaymentMethods: [
            availableMethods({
              paymentPeriodicities: [PaymentPeriodicity.monthly],
            }),
          ],
        })
      );

      await expect(
        service.updateOffer({ id: 'offer-1', memberPlanId: 'plan-2' })
      ).rejects.toThrow('The member plan is not sold with this periodicity');
      expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
    });

    it('accepts changing to a periodicity the member plan sells', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({
          periodicityPricing: [monthlyPrice(1000)],
          availablePaymentMethods: [
            availableMethods({
              paymentPeriodicities: [PaymentPeriodicity.monthly],
            }),
          ],
        })
      );

      await service.updateOffer({
        id: 'offer-1',
        periodicity: PaymentPeriodicity.monthly,
      });

      expect(prisma.giftCodeOffer.update).toHaveBeenCalled();
    });

    it('rejects an unknown offer', async () => {
      const { service, prisma } = setup();
      prisma.giftCodeOffer.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOffer({ id: 'missing', name: 'x' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('automatic renewal', () => {
    const renewing = (overrides: Record<string, unknown> = {}) =>
      createInput({
        autoRenew: true,
        renewalPaymentMethodId: 'pm-renew',
        ...overrides,
      });

    it('stores the renewal settings', async () => {
      const { service, prisma } = setup();

      await service.createOffer(renewing());

      expect(prisma.giftCodeOffer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          autoRenew: true,
          renewalPaymentMethodId: 'pm-renew',
        }),
      });
    });

    it('leaves renewal to the database default when nothing is sent', async () => {
      const { service, prisma } = setup();

      await service.createOffer(createInput());

      const { data } = prisma.giftCodeOffer.create.mock.calls[0][0];
      expect(data.autoRenew).toBeUndefined();
      expect(data.renewalPaymentMethodId).toBeUndefined();
    });

    it('does not require the renewal method to support standalone invoices', async () => {
      const { service, payments, prisma } = setup();

      await service.createOffer(renewing());

      expect(payments.assertStandalonePaymentMethod).not.toHaveBeenCalledWith(
        'pm-renew'
      );
      expect(prisma.giftCodeOffer.create).toHaveBeenCalled();
    });

    it.each([undefined, null])(
      'requires a renewal payment method (%j)',
      async renewalPaymentMethodId => {
        const { service, prisma } = setup();

        await expect(
          service.createOffer(renewing({ renewalPaymentMethodId }))
        ).rejects.toThrow('Choose a payment method for the automatic renewal');
        expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
      }
    );

    it.each([false, undefined])(
      'rejects a renewal payment method without automatic renewal (%j)',
      async autoRenew => {
        const { service, prisma } = setup();

        await expect(
          service.createOffer(renewing({ autoRenew }))
        ).rejects.toThrow(
          'Only offers that renew automatically can have a renewal payment method'
        );
        expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
      }
    );

    it('rejects automatic renewal for a member plan that cannot be extended', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({ extendable: false })
      );

      await expect(service.createOffer(renewing())).rejects.toThrow(
        'This member plan cannot be renewed automatically'
      );
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('allows a member plan that cannot be extended without renewal', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({ extendable: false })
      );

      await service.createOffer(createInput({ autoRenew: false }));

      expect(prisma.giftCodeOffer.create).toHaveBeenCalled();
    });

    it.each([
      [
        'is not on the member plan',
        [availableMethods({ paymentMethodIDs: ['pm-other'] })],
      ],
      [
        'is only offered for another periodicity',
        [
          availableMethods({ paymentMethodIDs: ['pm-other'] }),
          availableMethods({
            paymentPeriodicities: [PaymentPeriodicity.monthly],
          }),
        ],
      ],
      ['is offered nowhere', [availableMethods({ paymentMethodIDs: [] })]],
    ])(
      'rejects a renewal method that %s',
      async (_, availablePaymentMethods) => {
        const { service, prisma } = setup();
        prisma.memberPlan.findUnique.mockResolvedValue(
          plan({ availablePaymentMethods })
        );

        await expect(service.createOffer(renewing())).rejects.toThrow(
          'The member plan does not offer this renewal payment method for this periodicity'
        );
        expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
      }
    );

    it('accepts a method from any matching row of the member plan', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({
          availablePaymentMethods: [
            availableMethods({ paymentMethodIDs: ['pm-other'] }),
            availableMethods({
              paymentMethodIDs: ['pm-x', 'pm-renew'],
              paymentPeriodicities: [
                PaymentPeriodicity.monthly,
                PaymentPeriodicity.yearly,
              ],
            }),
          ],
        })
      );

      await service.createOffer(renewing());

      expect(prisma.giftCodeOffer.create).toHaveBeenCalled();
    });

    it('accepts a method whose member plan row forces automatic renewal', async () => {
      const { service, prisma } = setup();
      prisma.memberPlan.findUnique.mockResolvedValue(
        plan({
          availablePaymentMethods: [
            availableMethods({ forceAutoRenewal: true }),
          ],
        })
      );

      await service.createOffer(renewing());

      expect(prisma.giftCodeOffer.create).toHaveBeenCalled();
    });

    it('rejects an inactive renewal payment method', async () => {
      const { service, prisma } = setup();
      prisma.paymentMethod.findUnique.mockResolvedValue(
        renewalMethod({ active: false })
      );

      await expect(service.createOffer(renewing())).rejects.toThrow(
        'Payment method Rechnung cannot be used for renewals'
      );
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('names an unknown renewal payment method by its id', async () => {
      const { service, prisma } = setup();
      prisma.paymentMethod.findUnique.mockResolvedValue(null);

      await expect(service.createOffer(renewing())).rejects.toThrow(
        'Payment method pm-renew cannot be used for renewals'
      );
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    it('rejects a renewal payment method of a retired provider', async () => {
      const { service, prisma } = setup();
      prisma.settingPaymentProvider.findMany.mockResolvedValue([
        { id: 'invoice' },
      ]);

      await expect(service.createOffer(renewing())).rejects.toThrow(
        'Payment method Rechnung cannot be used for renewals'
      );
      expect(prisma.giftCodeOffer.create).not.toHaveBeenCalled();
    });

    describe('on update', () => {
      it('turns renewal on', async () => {
        const { service, prisma } = setup();

        await service.updateOffer({
          id: 'offer-1',
          autoRenew: true,
          renewalPaymentMethodId: 'pm-renew',
        });

        expect(prisma.giftCodeOffer.update).toHaveBeenCalledWith({
          where: { id: 'offer-1' },
          data: {
            autoRenew: true,
            renewalPaymentMethodId: 'pm-renew',
            paymentMethods: undefined,
          },
        });
      });

      it('clears the renewal payment method when renewal is turned off', async () => {
        const { service, prisma } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(
          offer({ autoRenew: true, renewalPaymentMethodId: 'pm-renew' })
        );

        await service.updateOffer({ id: 'offer-1', autoRenew: false });

        expect(prisma.giftCodeOffer.update).toHaveBeenCalledWith({
          where: { id: 'offer-1' },
          data: {
            autoRenew: false,
            renewalPaymentMethodId: null,
            paymentMethods: undefined,
          },
        });
      });

      it('keeps the renewal settings when they are not sent', async () => {
        const { service, prisma } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(
          offer({ autoRenew: true, renewalPaymentMethodId: 'pm-renew' })
        );

        await service.updateOffer({ id: 'offer-1', name: 'Renamed' });

        expect(prisma.giftCodeOffer.update).toHaveBeenCalledWith({
          where: { id: 'offer-1' },
          data: { name: 'Renamed', paymentMethods: undefined },
        });
      });

      it('rejects clearing the method of a renewing offer', async () => {
        const { service, prisma } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(
          offer({ autoRenew: true, renewalPaymentMethodId: 'pm-renew' })
        );

        await expect(
          service.updateOffer({ id: 'offer-1', renewalPaymentMethodId: null })
        ).rejects.toThrow('Choose a payment method for the automatic renewal');
        expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
      });

      it('re-validates the stored method when the periodicity changes', async () => {
        const { service, prisma } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(
          offer({ autoRenew: true, renewalPaymentMethodId: 'pm-renew' })
        );
        prisma.memberPlan.findUnique.mockResolvedValue(
          plan({
            periodicityPricing: [
              yearlyPrice(10000),
              {
                periodicity: PaymentPeriodicity.monthly,
                amountMin: 1000,
                amountTarget: null,
                amountMax: null,
              },
            ],
            availablePaymentMethods: [
              availableMethods(),
              availableMethods({
                paymentMethodIDs: ['pm-other'],
                paymentPeriodicities: [PaymentPeriodicity.monthly],
              }),
            ],
          })
        );

        await expect(
          service.updateOffer({
            id: 'offer-1',
            periodicity: PaymentPeriodicity.monthly,
          })
        ).rejects.toThrow(
          'The member plan does not offer this renewal payment method for this periodicity'
        );
        expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
      });

      it('re-validates renewal when the member plan changes', async () => {
        const { service, prisma } = setup();
        prisma.giftCodeOffer.findUnique.mockResolvedValue(
          offer({ autoRenew: true, renewalPaymentMethodId: 'pm-renew' })
        );
        prisma.memberPlan.findUnique.mockResolvedValue(
          plan({ id: 'plan-2', extendable: false })
        );

        await expect(
          service.updateOffer({ id: 'offer-1', memberPlanId: 'plan-2' })
        ).rejects.toThrow('This member plan cannot be renewed automatically');
        expect(prisma.giftCodeOffer.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteOffer', () => {
    it('is blocked when codes were sold', async () => {
      const { service, prisma } = setup();
      prisma.giftCode.count.mockResolvedValue(2);

      await expect(service.deleteOffer('offer-1')).rejects.toThrow(
        'This offer has gift codes. Deactivate it instead.'
      );
      expect(prisma.giftCode.count).toHaveBeenCalledWith({
        where: { offerId: 'offer-1' },
      });
      expect(prisma.giftCodeOffer.delete).not.toHaveBeenCalled();
    });

    it('deletes an offer without codes', async () => {
      const { service, prisma } = setup();

      await expect(service.deleteOffer('offer-1')).resolves.toEqual(offer());

      expect(prisma.giftCodeOffer.delete).toHaveBeenCalledWith({
        where: { id: 'offer-1' },
      });
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
