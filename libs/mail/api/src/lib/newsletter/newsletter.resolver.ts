import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { Newsletter, SubscribeToNewsletterArgs } from './newsletter.model';
import { NewsletterService } from './newsletter.service';

@Resolver(() => Newsletter)
export class NewsletterResolver {
  constructor(private newsletterService: NewsletterService) {}

  @Public()
  @Query(() => [Newsletter], {
    name: 'newsletters',
    description: 'Returns every newsletter a visitor can subscribe to.',
  })
  newsletters() {
    return this.newsletterService.getNewsletters();
  }

  @Public()
  @Mutation(() => Boolean, {
    name: 'subscribeToNewsletter',
    description:
      'Requests a newsletter subscription. The newsletter provider asks the given address to confirm the subscription.',
  })
  subscribeToNewsletter(@Args() args: SubscribeToNewsletterArgs) {
    return this.newsletterService.subscribe(args);
  }
}
