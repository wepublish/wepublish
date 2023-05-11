import {Module} from '@nestjs/common'
import {OldContextModule, PrismaModule} from '@wepublish/nest-modules'
import {SystemMailResolver} from './system-mail.resolver'

@Module({
  imports: [PrismaModule, OldContextModule],
  providers: [SystemMailResolver]
})
export class SystemMailModule {}
