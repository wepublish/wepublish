import {Module} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {SystemMailResolver} from './system-mail.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PrismaService, SystemMailResolver]
})
export class SystemMailModule {}
