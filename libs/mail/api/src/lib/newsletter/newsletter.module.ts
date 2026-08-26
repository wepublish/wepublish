import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { NewsletterResolver } from './newsletter.resolver';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [PrismaModule, SettingModule],
  providers: [NewsletterService, NewsletterResolver],
  exports: [NewsletterService],
})
export class NewsletterModule {}
