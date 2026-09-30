import { Module } from '@nestjs/common';
import { PrismaModule } from '@wepublish/nest-modules';
import { SettingModule } from '@wepublish/settings/api';
import { UserModule } from '@wepublish/user/api';
import { NewsletterEligibilityService } from './newsletter-eligibility.service';
import { NewsletterListService } from './newsletter-list.service';
import { NewsletterListResolver } from './newsletter-list.resolver';
import { NewsletterListMemberPlansDataloader } from './newsletter-list-member-plans.dataloader';
import { NewsletterSubscriberService } from './newsletter-subscriber.service';
import { NewsletterMemberResolver } from './newsletter-member.resolver';
import { NewsletterSubscriberAdminService } from './newsletter-subscriber-admin.service';
import { NewsletterSubscriberAdminResolver } from './newsletter-subscriber-admin.resolver';

@Module({
  imports: [PrismaModule, SettingModule, UserModule],
  providers: [
    NewsletterEligibilityService,
    NewsletterListService,
    NewsletterListResolver,
    NewsletterListMemberPlansDataloader,
    NewsletterSubscriberService,
    NewsletterMemberResolver,
    NewsletterSubscriberAdminService,
    NewsletterSubscriberAdminResolver,
  ],
  exports: [NewsletterEligibilityService, NewsletterSubscriberService],
})
export class NewsletterModule {}
