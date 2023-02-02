import {Module} from '@nestjs/common'
import {PrismaModule} from '@wepublish/nest-modules'
import {MailProviderService, MailTemplateSyncService, PrismaService} from '@wepublish/api'
import {MailTemplatesResolver} from './mail-template.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PrismaService, MailProviderService, MailTemplatesResolver, MailTemplateSyncService]
})
export class MailTemplateModule {}
