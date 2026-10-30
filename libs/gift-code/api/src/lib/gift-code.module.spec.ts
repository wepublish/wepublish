import { Test } from '@nestjs/testing';
import { PrismaClient, SellableKind } from '@prisma/client';
import { FeaturesService } from '@wepublish/features/api';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import {
  InvoicePaidNotifier,
  PaymentsModule,
  PaymentsService,
  SellableCheckoutService,
  SellableModule,
  SellableRegistry,
} from '@wepublish/payment/api';
import {
  GiftCodeAttemptLimiter,
  GiftCodeInvoiceDataloader,
  GiftCodeInvoiceResolver,
  GiftCodeInvoiceService,
  GiftCodeModule,
  GiftCodeOfferDataloader,
  GiftCodeOfferResolver,
  GiftCodeOfferService,
  GiftCodePurchaseDataloader,
  GiftCodeResolver,
  GiftCodeSellableHandler,
  GiftCodeService,
} from '..';

const metadata = (key: string) => Reflect.getMetadata(key, GiftCodeModule);

describe('GiftCodeModule', () => {
  it('shares the sellable registry of the PaymentsModule', () => {
    expect(metadata('imports')).toEqual(
      expect.arrayContaining([PaymentsModule, SellableModule])
    );
  });

  it('imports the member plan module without forwardRef', () => {
    expect(metadata('imports')).toContain(MemberPlanModule);
  });

  it('provides the gift code services, resolvers and the sellable handler', () => {
    expect(metadata('providers')).toEqual(
      expect.arrayContaining([
        GiftCodeOfferService,
        GiftCodeOfferDataloader,
        GiftCodeOfferResolver,
        GiftCodeService,
        GiftCodePurchaseDataloader,
        GiftCodeResolver,
        GiftCodeSellableHandler,
      ])
    );
    expect(metadata('exports')).toEqual([
      GiftCodeOfferService,
      GiftCodeOfferDataloader,
      GiftCodeService,
    ]);
  });

  it('provides paying invoices with a gift code', () => {
    expect(metadata('providers')).toEqual(
      expect.arrayContaining([
        GiftCodeAttemptLimiter,
        GiftCodeInvoiceDataloader,
        GiftCodeInvoiceService,
        GiftCodeInvoiceResolver,
      ])
    );
  });

  it('registers the gift code handler when the app starts', async () => {
    const module = await Test.createTestingModule({
      providers: [
        SellableRegistry,
        GiftCodeSellableHandler,
        { provide: GiftCodeService, useValue: {} },
        { provide: FeaturesService, useValue: {} },
      ],
    }).compile();

    await module.init();

    expect(module.get(SellableRegistry).get(SellableKind.giftCode)).toBe(
      module.get(GiftCodeSellableHandler)
    );
  });

  it('registers the handler with the real gift code services', async () => {
    const module = await Test.createTestingModule({
      providers: [
        SellableRegistry,
        GiftCodeSellableHandler,
        GiftCodeService,
        GiftCodeOfferService,
        GiftCodeOfferDataloader,
        { provide: PrismaClient, useValue: {} },
        { provide: PaymentsService, useValue: {} },
        { provide: SellableCheckoutService, useValue: {} },
        { provide: InvoicePaidNotifier, useValue: {} },
        { provide: FeaturesService, useValue: {} },
      ],
    }).compile();

    await module.init();

    expect(module.get(SellableRegistry).get(SellableKind.giftCode)).toBe(
      module.get(GiftCodeSellableHandler)
    );
  });
});
