import { Module } from '@nestjs/common';
import { GateModule } from '@wepublish/gate/api';
import { PaywallResolver } from './paywall.resolver';
import {
  HasOptionalPaywallResolver,
  HasPaywallResolver,
} from './has-paywall/has-paywall.resolver';

@Module({
  imports: [GateModule],
  providers: [PaywallResolver, HasPaywallResolver, HasOptionalPaywallResolver],
})
export class PaywallModule {}
