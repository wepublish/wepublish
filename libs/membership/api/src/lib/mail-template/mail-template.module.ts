import {Module} from '@nestjs/common'
import {OldContextService, PrismaService} from '@wepublish/api'
import {PrismaModule} from '@wepublish/nest-modules'
import {MailTemplateSyncService} from './mail-template-sync.service'
import {MailTemplatesResolver} from './mail-template.resolver'

@Module({
  imports: [PrismaModule],
  providers: [PrismaService, MailTemplatesResolver, MailTemplateSyncService, OldContextService]
})
export class MailTemplateModule {}
