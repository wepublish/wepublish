import { Module } from '@nestjs/common';
import { GateModule } from '@wepublish/gate/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { ContentGateAccessService } from './content-gate-access.service';

@Module({
  imports: [GateModule, PrismaModule],
  providers: [ContentGateAccessService],
  exports: [ContentGateAccessService],
})
export class ContentGateModule {}
