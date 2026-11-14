import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { PaymentsModule } from '@wepublish/payment/api';
import { MemberContextModule } from '../legacy/member-context.module';
import { PeriodicitySwitchResolver } from './periodicity-switch.resolver';
import { PeriodicitySwitchService } from './periodicity-switch.service';

@Module({
  imports: [PrismaModule, MemberContextModule, PaymentsModule],
  providers: [PeriodicitySwitchResolver, PeriodicitySwitchService],
})
export class PeriodicitySwitchModule {}
