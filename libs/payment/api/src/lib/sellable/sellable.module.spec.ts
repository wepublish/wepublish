import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { InvoicePaidNotifier } from '../invoice-paid.listener';
import { PaymentsModule } from '../payments.module';
import { PaymentsService } from '../payments.service';
import { SellableCheckoutService } from './sellable-checkout.service';
import { SellableFulfilmentService } from './sellable-fulfilment.service';
import { SellableReconciliationService } from './sellable-reconciliation.service';
import { SellableRegistry } from './sellable-registry.service';
import { SellableModule } from './sellable.module';

@Module({
  providers: [
    InvoicePaidNotifier,
    SellableRegistry,
    { provide: PaymentsService, useValue: {} },
  ],
  exports: [InvoicePaidNotifier, SellableRegistry, PaymentsService],
})
class StubPaymentsModule {}

describe('SellableModule', () => {
  const compile = () =>
    Test.createTestingModule({ imports: [SellableModule] })
      .overrideModule(PaymentsModule)
      .useModule(StubPaymentsModule)
      .overrideProvider(PrismaClient)
      .useValue({})
      .compile();

  it('exposes the registry, checkout and reconciliation services', async () => {
    const module = await compile();

    expect(module.get(SellableRegistry)).toBeInstanceOf(SellableRegistry);
    expect(module.get(SellableCheckoutService)).toBeInstanceOf(
      SellableCheckoutService
    );
    expect(module.get(SellableReconciliationService)).toBeInstanceOf(
      SellableReconciliationService
    );
  });

  it('takes the registry from the payments module so payments can consult it', () => {
    const meta = (key: string, target: object) =>
      Reflect.getMetadata(key, target);

    expect(meta('providers', PaymentsModule)).toContain(SellableRegistry);
    expect(meta('exports', PaymentsModule)).toContain(SellableRegistry);
    expect(meta('providers', SellableModule)).not.toContain(SellableRegistry);
    expect(meta('exports', SellableModule)).not.toContain(SellableRegistry);
  });

  it('registers the fulfilment service with the payments notifier on init', async () => {
    const module = await compile();
    await module.init();

    const reconcileInvoice = vi
      .spyOn(module.get(SellableFulfilmentService), 'reconcileInvoice')
      .mockResolvedValue(undefined);

    await module.get(InvoicePaidNotifier).notify('invoice-1');

    expect(reconcileInvoice).toHaveBeenCalledWith('invoice-1');
  });
});
