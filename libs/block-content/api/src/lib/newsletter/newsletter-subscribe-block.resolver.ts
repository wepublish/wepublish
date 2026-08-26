import { forwardRef, Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Newsletter, NewsletterService } from '@wepublish/mail/api';
import { NewsletterSubscribeBlock } from './newsletter-subscribe-block.model';

@Resolver(() => NewsletterSubscribeBlock)
export class NewsletterSubscribeBlockResolver {
  constructor(
    @Inject(forwardRef(() => NewsletterService))
    private newsletterService: NewsletterService
  ) {}

  @ResolveField(() => [Newsletter])
  async newsletters(
    @Parent() parent: NewsletterSubscribeBlock
  ): Promise<Newsletter[]> {
    return await this.newsletterService.getNewsletters(parent.newsletterIds);
  }

  @ResolveField(() => [String])
  async newsletterIds(
    @Parent() parent: NewsletterSubscribeBlock
  ): Promise<string[]> {
    const newsletters = await this.newsletterService.getNewsletters(
      parent.newsletterIds
    );

    return newsletters.map(({ id }) => id);
  }
}
