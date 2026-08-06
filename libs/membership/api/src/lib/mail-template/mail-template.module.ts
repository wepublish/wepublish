import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MailTemplatesResolver } from './mail-template.resolver';
import { MailTemplateService } from './mail-template.service';

@Module({
  imports: [PrismaModule],
  providers: [MailTemplatesResolver, MailTemplateService],
})
export class MailTemplateModule {}
