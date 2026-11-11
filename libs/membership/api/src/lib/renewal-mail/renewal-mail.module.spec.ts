import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { MailContext } from '@wepublish/mail/api';
import { InvoicePaidNotifier, PaymentsModule } from '@wepublish/payment/api';
import { RenewalMailModule } from './renewal-mail.module';
import { RenewalSuccessMailService } from './renewal-success-mail.service';

@Global()
@Module({
  providers: [{ provide: MailContext, useValue: {} }],
  exports: [MailContext],
})
class StubMailsModule {}

@Module({
  providers: [InvoicePaidNotifier],
  exports: [InvoicePaidNotifier],
})
class StubPaymentsModule {}

describe('RenewalMailModule', () => {
  it('registers the renewal success mail service with the payments notifier on init', async () => {
    const module = await Test.createTestingModule({
      imports: [StubMailsModule, RenewalMailModule],
    })
      .overrideModule(PaymentsModule)
      .useModule(StubPaymentsModule)
      .overrideProvider(PrismaClient)
      .useValue({})
      .compile();
    await module.init();

    const service = module.get(RenewalSuccessMailService);
    const onInvoicePaid = vi
      .spyOn(service, 'onInvoicePaid')
      .mockResolvedValue(undefined);

    await module.get(InvoicePaidNotifier).notify('invoice-1');

    expect(onInvoicePaid).toHaveBeenCalledWith('invoice-1');
  });
});
