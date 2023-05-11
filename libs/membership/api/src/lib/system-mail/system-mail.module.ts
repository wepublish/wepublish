import {Module} from '@nestjs/common'
import {OldContextModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {SystemMailResolver} from './system-mail.resolver'

@Module({
  imports: [PrismaModule, OldContextModule],
  providers: [SystemMailResolver, PrismaService]
})
export class SystemMailModule {}
