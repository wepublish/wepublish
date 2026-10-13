import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { DiscountCodeResolver } from './discountCode.resolver';
import { DiscountCodeService } from './discountCode.service';
import { DiscountCodeDataloader } from './discountCode.dataloader';
import { DiscountCodeUsageDataloader } from './discount-code-usage.dataloader';
import { MemberPlanModule } from '@wepublish/member-plan/api';

@Module({
  imports: [PrismaModule, MemberPlanModule],
  providers: [
    DiscountCodeDataloader,
    DiscountCodeUsageDataloader,
    DiscountCodeService,
    DiscountCodeResolver,
  ],
  exports: [DiscountCodeDataloader, DiscountCodeService],
})
export class DiscountCodeModule {}
