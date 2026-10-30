import { Module } from '@nestjs/common';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  PaymentMethodModule,
  PaymentsModule,
  SellableModule,
} from '@wepublish/payment/api';
import { UserModule } from '@wepublish/user/api';
import { GiftCodeAttemptLimiter } from './gift-code-attempt-limiter';
import { GiftCodeInvoiceDataloader } from './gift-code-invoice.dataloader';
import { GiftCodeInvoiceResolver } from './gift-code-invoice.resolver';
import { GiftCodeInvoiceService } from './gift-code-invoice.service';
import { GiftCodeOfferDataloader } from './gift-code-offer.dataloader';
import { GiftCodeOfferResolver } from './gift-code-offer.resolver';
import { GiftCodeOfferService } from './gift-code-offer.service';
import { GiftCodePurchaseDataloader } from './gift-code-purchase.dataloader';
import { GiftCodeSellableHandler } from './gift-code-sellable.handler';
import { GiftCodeResolver } from './gift-code.resolver';
import { GiftCodeService } from './gift-code.service';

@Module({
  imports: [
    PrismaModule,
    PaymentsModule,
    PaymentMethodModule,
    SellableModule,
    MemberPlanModule,
    UserModule,
  ],
  providers: [
    GiftCodeOfferService,
    GiftCodeOfferDataloader,
    GiftCodeOfferResolver,
    GiftCodeService,
    GiftCodePurchaseDataloader,
    GiftCodeResolver,
    GiftCodeSellableHandler,
    GiftCodeAttemptLimiter,
    GiftCodeInvoiceDataloader,
    GiftCodeInvoiceService,
    GiftCodeInvoiceResolver,
  ],
  exports: [GiftCodeOfferService, GiftCodeOfferDataloader, GiftCodeService],
})
export class GiftCodeModule {}
