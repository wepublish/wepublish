import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SystemMailResolver } from './system-mail.resolver';

@Module({
  imports: [PrismaModule],
  providers: [SystemMailResolver],
})
export class SystemMailModule {}
