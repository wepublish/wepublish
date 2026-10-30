import { NotFoundException } from '@nestjs/common';
import { Currency, PaymentPeriodicity } from '@prisma/client';
import { FEATURE_METADATA_KEY } from '@wepublish/features/api';
import { MemberPlanDataloader } from '@wepublish/member-plan/api';
import { PaymentMethodDataloader } from '@wepublish/payment/api';
import {
  CanDeleteGiftCodes,
  CanGetGiftCodes,
  CanUpdateGiftCodes,
} from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { GiftCodeOfferDataloader } from './gift-code-offer.dataloader';
import { GiftCodeOfferResolver } from './gift-code-offer.resolver';
import { GiftCodeOfferService } from './gift-code-offer.service';

const offer = {
  id: 'offer-1',
  memberPlanId: 'plan-1',
  periodicity: PaymentPeriodicity.yearly,
} as never;

const setup = () => {
  const service = {
    getOffers: vi.fn().mockResolvedValue({ nodes: [] }),
    createOffer: vi.fn().mockResolvedValue(offer),
    updateOffer: vi.fn().mockResolvedValue(offer),
    deleteOffer: vi.fn().mockResolvedValue(offer),
    getPrice: vi.fn().mockReturnValue({ amount: 100, currency: Currency.CHF }),
    getPaymentMethods: vi.fn().mockResolvedValue([{ id: 'pm-1' }]),
    getPaymentMethodIds: vi.fn().mockResolvedValue(['pm-1', 'pm-2']),
  };
  const dataloader = { load: vi.fn().mockResolvedValue(offer) };
  const memberPlans = {
    load: vi.fn().mockResolvedValue({ id: 'plan-1', currency: Currency.CHF }),
  };
  const paymentMethods = {
    load: vi.fn().mockResolvedValue({ id: 'pm-renew', name: 'Rechnung' }),
  };

  const resolver = new GiftCodeOfferResolver(
    service as unknown as GiftCodeOfferService,
    dataloader as unknown as GiftCodeOfferDataloader,
    memberPlans as unknown as MemberPlanDataloader,
    paymentMethods as unknown as PaymentMethodDataloader
  );

  return { resolver, service, dataloader, memberPlans, paymentMethods };
};

describe('GiftCodeOfferResolver', () => {
  it('is only available with the gift-codes feature', () => {
    expect(
      Reflect.getMetadata(FEATURE_METADATA_KEY, GiftCodeOfferResolver)
    ).toEqual(['gift-codes']);
  });

  it('injects every dependency by its type', () => {
    expect(
      Reflect.getMetadata('self:paramtypes', GiftCodeOfferResolver) ?? []
    ).toEqual([]);
  });

  it.each(['giftCodeOffers', 'giftCodeOffer'] as const)(
    'lets every gift code permission read %s',
    method => {
      expect(
        Reflect.getMetadata(
          PERMISSIONS_METADATA_KEY,
          GiftCodeOfferResolver.prototype[method]
        )
      ).toEqual([CanGetGiftCodes, CanUpdateGiftCodes, CanDeleteGiftCodes]);
    }
  );

  it.each([
    ['createGiftCodeOffer', CanUpdateGiftCodes],
    ['updateGiftCodeOffer', CanUpdateGiftCodes],
    ['deleteGiftCodeOffer', CanDeleteGiftCodes],
  ] as const)('guards %s with its permission', (method, permission) => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_METADATA_KEY,
        GiftCodeOfferResolver.prototype[method]
      )
    ).toEqual([permission]);
  });

  it('loads one offer', async () => {
    const { resolver, dataloader } = setup();

    await expect(resolver.giftCodeOffer('offer-1')).resolves.toBe(offer);
    expect(dataloader.load).toHaveBeenCalledWith('offer-1');
  });

  it('throws for an unknown offer', async () => {
    const { resolver, dataloader } = setup();
    dataloader.load.mockResolvedValue(null);

    await expect(resolver.giftCodeOffer('missing')).rejects.toThrow(
      NotFoundException
    );
  });

  it('delegates the mutations', async () => {
    const { resolver, service } = setup();
    const input = {
      name: 'Gift',
      memberPlanId: 'plan-1',
      periodicity: PaymentPeriodicity.yearly,
      active: true,
      issueBeforePayment: false,
      paymentMethodIds: ['pm-1'],
    };

    await resolver.createGiftCodeOffer(input);
    await resolver.updateGiftCodeOffer({ id: 'offer-1', name: 'x' });
    await resolver.deleteGiftCodeOffer('offer-1');

    expect(service.createOffer).toHaveBeenCalledWith(input);
    expect(service.updateOffer).toHaveBeenCalledWith({
      id: 'offer-1',
      name: 'x',
    });
    expect(service.deleteOffer).toHaveBeenCalledWith('offer-1');
  });

  it('prices the offer with its member plan', async () => {
    const { resolver, service, memberPlans } = setup();

    await expect(resolver.price(offer)).resolves.toEqual({
      amount: 100,
      currency: Currency.CHF,
    });
    expect(memberPlans.load).toHaveBeenCalledWith('plan-1');
    expect(service.getPrice).toHaveBeenCalledWith({
      periodicity: PaymentPeriodicity.yearly,
      memberPlan: { id: 'plan-1', currency: Currency.CHF },
    });
  });

  it('resolves the filtered payment methods and the configured ids', async () => {
    const { resolver, service } = setup();

    await expect(resolver.paymentMethods(offer)).resolves.toEqual([
      { id: 'pm-1' },
    ]);
    await expect(resolver.paymentMethodIds(offer)).resolves.toEqual([
      'pm-1',
      'pm-2',
    ]);
    expect(service.getPaymentMethods).toHaveBeenCalledWith('offer-1');
    expect(service.getPaymentMethodIds).toHaveBeenCalledWith('offer-1');
  });

  it('resolves the renewal payment method', async () => {
    const { resolver, paymentMethods } = setup();

    await expect(
      resolver.renewalPaymentMethod({
        ...(offer as object),
        renewalPaymentMethodId: 'pm-renew',
      } as never)
    ).resolves.toEqual({ id: 'pm-renew', name: 'Rechnung' });
    expect(paymentMethods.load).toHaveBeenCalledWith('pm-renew');
  });

  it('resolves no renewal payment method for an offer without renewal', async () => {
    const { resolver, paymentMethods } = setup();

    await expect(
      resolver.renewalPaymentMethod({
        ...(offer as object),
        renewalPaymentMethodId: null,
      } as never)
    ).resolves.toBeNull();
    expect(paymentMethods.load).not.toHaveBeenCalled();
  });
});
