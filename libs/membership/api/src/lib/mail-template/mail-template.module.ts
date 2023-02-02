import {Module} from '@nestjs/common'
import {PrismaService} from '@wepublish/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {MailProviderService} from './mail-provider.service'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {MailTemplatesResolver} from './mail-template.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PrismaService, MailProviderService, MailTemplatesResolver, MailTemplateSyncService]
})
export class MailTemplateModule {}
