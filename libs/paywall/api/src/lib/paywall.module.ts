import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaywallDataloaderService } from './paywall-dataloader.service';
import { PaywallService } from './paywall.service';
import { PaywallResolver } from './paywall.resolver';
import {
  HasOptionalPaywallResolver,
  HasPaywallResolver,
} from './has-paywall/has-paywall.resolver';

@Module({
  imports: [PrismaModule],
  providers: [
    PaywallDataloaderService,
    PaywallService,
    PaywallResolver,
    HasPaywallResolver,
    HasOptionalPaywallResolver,
  ],
  exports: [PaywallDataloaderService, PaywallService],
})
export class PaywallModule {}
