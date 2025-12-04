import { Module } from '@nestjs/common';
import { MemberContextService } from './member-context.service';
import { PrismaModule } from '@wepublish/nest-modules';

@Module({
  imports: [PrismaModule],
  providers: [MemberContextService],
  exports: [MemberContextService],
})
export class MemberContextModule {}
