import { Module } from '@nestjs/common';
import { MemberContextService } from './member-context.service';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';

@Module({
  imports: [PrismaModule, PaymentsModule],
  providers: [MemberContextService],
  exports: [MemberContextService],
})
export class MemberContextModule {}
