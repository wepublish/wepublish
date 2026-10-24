import { forwardRef, Module } from '@nestjs/common';
import { GraphqlResponseCacheModule } from '@wepublish/kv-ttl-cache/api';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PrismaModule } from '@wepublish/nest-modules';
import {
  PaymentMethodModule,
  PaymentsModule,
  SellableModule,
} from '@wepublish/payment/api';
import { UserModule } from '@wepublish/user/api';
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
    forwardRef(() => MemberPlanModule),
    UserModule,
    GraphqlResponseCacheModule,
  ],
  providers: [
    GiftCodeOfferService,
    GiftCodeOfferDataloader,
    GiftCodeOfferResolver,
    GiftCodeService,
    GiftCodePurchaseDataloader,
    GiftCodeResolver,
    GiftCodeSellableHandler,
  ],
  exports: [GiftCodeOfferService, GiftCodeOfferDataloader, GiftCodeService],
})
export class GiftCodeModule {}
