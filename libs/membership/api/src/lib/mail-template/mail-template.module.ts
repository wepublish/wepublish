import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MailTemplateSyncService } from './mail-template-sync.service';
import { MailTemplatesResolver } from './mail-template.resolver';

@Module({
  imports: [PrismaModule],
  providers: [MailTemplatesResolver, MailTemplateSyncService],
})
export class MailTemplateModule {}
