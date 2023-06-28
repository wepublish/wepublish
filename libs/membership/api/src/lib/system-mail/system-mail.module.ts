import {Module} from '@nestjs/common'
import {PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {SystemMailResolver} from './system-mail.resolver'

@Module({
  imports: [PrismaModule],
  providers: [SystemMailResolver, PrismaService]
})
export class SystemMailModule {}
