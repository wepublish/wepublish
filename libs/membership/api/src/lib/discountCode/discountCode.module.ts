import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { DiscountCodeResolver } from './discountCode.resolver';
import { DiscountCodeService } from './discountCode.service';
import { DiscountCodeDataloader } from './discountCode.dataloader';
import { MemberPlanModule } from '@wepublish/member-plan/api';

@Module({
  imports: [PrismaModule, MemberPlanModule],
  providers: [
    DiscountCodeDataloader,
    DiscountCodeService,
    DiscountCodeResolver,
  ],
  exports: [DiscountCodeDataloader, DiscountCodeService],
})
export class DiscountCodeModule {}
