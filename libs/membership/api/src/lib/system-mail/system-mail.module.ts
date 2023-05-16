import {Module} from '@nestjs/common'
import {PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {SystemMailResolver} from './system-mail.resolver'
import {MailsModule} from '@wepublish/mails'

@Module({
  imports: [PrismaModule, MailsModule],
  providers: [SystemMailResolver, PrismaService]
})
export class SystemMailModule {}
