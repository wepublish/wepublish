import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { MailTemplatesResolver } from './mail-template.resolver';

@Module({
  imports: [PrismaModule],
  providers: [MailTemplatesResolver],
})
export class MailTemplateModule {}
