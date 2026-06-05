import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { VoucherResolver } from './voucher.resolver';
import { VoucherService } from './voucher.service';
import { VoucherDataloader } from './voucher.dataloader';
import { MemberPlanModule } from '@wepublish/member-plan/api';

@Module({
  imports: [PrismaModule, MemberPlanModule],
  providers: [VoucherDataloader, VoucherService, VoucherResolver],
  exports: [VoucherDataloader, VoucherService],
})
export class VoucherModule {}
