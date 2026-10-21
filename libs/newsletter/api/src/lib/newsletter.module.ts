import { Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { NewsletterCampaignResolver } from './newsletter-campaign.resolver';
import { NewsletterCampaignService } from './newsletter-campaign.service';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';
import { NewsletterRenderService } from './newsletter-render.service';

@Module({
  imports: [PrismaModule, ImageModule, SettingModule],
  providers: [
    NewsletterCampaignResolver,
    NewsletterCampaignService,
    NewsletterMailchimpService,
    NewsletterRenderService,
  ],
})
export class NewsletterModule {}
