import {Module} from '@nestjs/common'
import {OldContextService, PrismaService} from '@wepublish/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {SystemMailResolver} from './system-mail.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PrismaService, SystemMailResolver, OldContextService]
})
export class SystemMailModule {}
