import {Module} from '@nestjs/common'
import {OldContextModule, PrismaModule, PrismaService} from '@wepublish/nest-modules'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {MailTemplatesResolver} from './mail-template.resolver'

@Module({
  imports: [PrismaModule, OldContextModule],
  providers: [MailTemplatesResolver, MailTemplateSyncService, PrismaService]
})
export class MailTemplateModule {}
