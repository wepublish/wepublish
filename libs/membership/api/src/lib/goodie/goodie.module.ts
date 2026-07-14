import { Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { MemberPlanModule } from '@wepublish/member-plan/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { GoodieDataloader } from './goodie.dataloader';
import { GoodieResolver } from './goodie.resolver';
import { GoodieService } from './goodie.service';
import { MemberPlanGoodiesResolver } from './member-plan-goodies.resolver';
import { SubscriptionGoodieResolver } from './subscription-goodie.resolver';

@Module({
  imports: [PrismaModule, MemberPlanModule, ImageModule],
  providers: [
    GoodieDataloader,
    GoodieService,
    GoodieResolver,
    MemberPlanGoodiesResolver,
    SubscriptionGoodieResolver,
  ],
  exports: [GoodieDataloader, GoodieService],
})
export class GoodieModule {}
