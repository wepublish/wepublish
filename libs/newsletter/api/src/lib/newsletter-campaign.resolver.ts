import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { imagesIn } from '@wepublish/newsletter/email';
import {
  CanCreateNewsletterCampaign,
  CanDeleteNewsletterCampaign,
  CanGetNewsletterCampaigns,
  CanPublishNewsletterCampaign,
  CanUpdateNewsletterCampaign,
} from '@wepublish/permissions';
import { Permissions } from '@wepublish/permissions/api';
import {
  CreateNewsletterCampaignArgs,
  NewsletterCampaign,
  NewsletterMergeFields,
  NewsletterPublishResult,
  NewsletterReport,
  UpdateNewsletterCampaignArgs,
} from './newsletter-campaign.model';
import { NewsletterCampaignService } from './newsletter-campaign.service';
import { NewsletterMailchimpService } from './newsletter-mailchimp.service';

@Resolver(() => NewsletterCampaign)
export class NewsletterCampaignResolver {
  constructor(
    private campaigns: NewsletterCampaignService,
    private mailchimp: NewsletterMailchimpService,
    private imageLoader: ImageDataloaderService
  ) {}

  @Permissions(CanGetNewsletterCampaigns)
  @Query(() => [NewsletterCampaign])
  newsletterCampaigns() {
    return this.campaigns.list();
  }

  @Permissions(CanGetNewsletterCampaigns)
  @Query(() => NewsletterCampaign)
  newsletterCampaign(@Args('id') id: string) {
    return this.campaigns.get(id);
  }

  @Permissions(CanGetNewsletterCampaigns)
  @Query(() => String, {
    description: 'The stored issue rendered as the HTML Mailchimp receives.',
  })
  newsletterCampaignPreview(@Args('id') id: string) {
    return this.campaigns.preview(id);
  }

  @Permissions(CanGetNewsletterCampaigns)
  @Query(() => NewsletterReport)
  newsletterCampaignReport(@Args('id') id: string) {
    return this.campaigns.report(id);
  }

  @Permissions(CanGetNewsletterCampaigns)
  @Query(() => NewsletterMergeFields)
  newsletterMergeFields() {
    return this.mailchimp.mergeFields();
  }

  @Permissions(CanCreateNewsletterCampaign)
  @Mutation(() => NewsletterCampaign)
  createNewsletterCampaign(
    @Args() { title, document }: CreateNewsletterCampaignArgs
  ) {
    return this.campaigns.create(title, document);
  }

  @Permissions(CanCreateNewsletterCampaign)
  @Mutation(() => NewsletterCampaign, {
    description:
      "A new campaign with the given one's document. The Mailchimp draft is not copied.",
  })
  duplicateNewsletterCampaign(@Args('id') id: string) {
    return this.campaigns.duplicate(id);
  }

  @Permissions(CanUpdateNewsletterCampaign)
  @Mutation(() => NewsletterCampaign)
  updateNewsletterCampaign(
    @Args() { id, title, document }: UpdateNewsletterCampaignArgs
  ) {
    return this.campaigns.update(id, title, document);
  }

  @Permissions(CanDeleteNewsletterCampaign)
  @Mutation(() => Boolean)
  async deleteNewsletterCampaign(@Args('id') id: string) {
    await this.campaigns.delete(id);

    return true;
  }

  @Permissions(CanPublishNewsletterCampaign)
  @Mutation(() => NewsletterPublishResult)
  publishNewsletterCampaign(@Args('id') id: string) {
    return this.campaigns.publish(id);
  }

  @ResolveField(() => [Image])
  async images(@Parent() { document }: NewsletterCampaign) {
    const images = await this.imageLoader.loadMany(
      imagesIn(document).map(({ id }) => id)
    );

    return images.filter(image => image && !(image instanceof Error));
  }
}
