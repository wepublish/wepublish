import { Module } from '@nestjs/common';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { MemberContextModule } from '@wepublish/membership/api';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  PaymentMethodModule,
  PaymentsModule,
  SellableModule,
} from '@wepublish/payment/api';
import { UserModule } from '@wepublish/user/api';
import { GiftCodeAttemptLimiter } from './gift-code-attempt-limiter';
import { GiftCodeInvoiceDataloader } from './gift-code-invoice.dataloader';
import { GiftCodeOfferDataloader } from './gift-code-offer.dataloader';
import { GiftCodeOfferResolver } from './gift-code-offer.resolver';
import { GiftCodeOfferService } from './gift-code-offer.service';
import { GiftCodePurchaseDataloader } from './gift-code-purchase.dataloader';
import { GiftCodeRedemptionResolver } from './gift-code-redemption.resolver';
import { GiftCodeRedemptionService } from './gift-code-redemption.service';
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
    MemberContextModule,
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
    GiftCodeRedemptionService,
    GiftCodeRedemptionResolver,
  ],
  exports: [GiftCodeOfferService, GiftCodeOfferDataloader, GiftCodeService],
})
export class GiftCodeModule {}
