import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { MailContext } from '@wepublish/mail/api';
import { INVOICE_PAID_LISTENER } from '@wepublish/payment/api';
import { RenewalMailModule } from './renewal-mail.module';
import { RenewalSuccessMailService } from './renewal-success-mail.service';

@Global()
@Module({
  providers: [{ provide: MailContext, useValue: {} }],
  exports: [MailContext],
})
class StubMailsModule {}

describe('RenewalMailModule', () => {
  it('binds the invoice paid listener to the renewal success mail service', async () => {
    const module = await Test.createTestingModule({
      imports: [StubMailsModule, RenewalMailModule],
    })
      .overrideProvider(PrismaClient)
      .useValue({})
      .compile();

    expect(module.get(INVOICE_PAID_LISTENER)).toBe(
      module.get(RenewalSuccessMailService)
    );
  });
});
