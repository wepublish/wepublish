import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MailTemplatesResolver } from './mail-template.resolver';
import { MailTemplateService } from './mail-template.service';
import { UsedMailTemplateDataloader } from './used-mail-template.dataloader';

@Module({
  imports: [PrismaModule],
  providers: [
    MailTemplatesResolver,
    MailTemplateService,
    UsedMailTemplateDataloader,
  ],
})
export class MailTemplateModule {}
