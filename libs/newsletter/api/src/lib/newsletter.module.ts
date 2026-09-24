import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { NewsletterContentService } from './newsletter-content.service';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';
import { NewsletterResolver } from './newsletter.resolver';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [PrismaModule, SettingModule],
  providers: [
    NewsletterService,
    NewsletterContentService,
    NewsletterMailchimpService,
    NewsletterResolver,
  ],
  exports: [NewsletterService, NewsletterContentService],
})
export class NewsletterModule {}
